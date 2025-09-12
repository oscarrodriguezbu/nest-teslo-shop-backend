import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) { }

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image })),
        user,
      });

      await this.productRepository.save(product);

      return { ...product, images };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    })

    return products.map((product) => ({
      ...product,
      images: product.images.map(img => img.url)
    }))
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); //? queryBuilder para crear queries personalizados
      //? prod ES UN ALIAS QUE SIRVE CON leftJoinAndSelect
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', { //:title y :slug son los argumentos que se establen en los params acontinuacion:
          title: term.toUpperCase(), // toUpperCase para hacer match con el UPPER en la bd
          slug: term.toLowerCase(), // siempre se guarda en lowercase entonces no necesita convertir la data de la bd
        })
        .leftJoinAndSelect('prod.images', 'prodImages') //? prodImages ES OTRO ALIAS
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with ${term} not found`);

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    //? queryRunner Sirve para asegurar el guardado correcto de la data, si algo sale mal, entonces tambien afeta a las relaciones
    //? en este caso a las imagenes de los productos

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } }); // busca y elimina por id

        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      }
      // await this.productRepository.save( product );
      product.user = user;

      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction(); // ejecuta el cambio
      await queryRunner.release(); //el release termina la transaccion

      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction(); // hace rollback si todo falla
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error)
    // console.log(error)
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() { // solo por si acaso, se utiliza para lo de la semilla
    const query = this.productRepository.createQueryBuilder('product');

    // se puede colocar condiciones adicionales, como que si es en produccion no se ejecute y etc

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
