import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities';


@Entity('users') //este es el nombre de la tabla en la bd
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    email: string;

    @Column('text', {
        select: false
    })
    password: string;

    @Column('text')
    fullName: string;

    @Column('bool', {
        default: true
    })
    isActive: boolean;

    @Column('text', {
        array: true,
        default: ['user']
    })
    roles: string[];

    @OneToMany(
        () => Product, //entidad
        (product) => product.user
    )
    product: Product;


    @BeforeInsert() // son como los triggers de las base de datos
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate() // son como los triggers de las base de datos
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }

}
