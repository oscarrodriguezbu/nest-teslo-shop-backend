import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([User]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({ // sirve para trabajar con env o alguna configuracion que necesito antes de que todo corra
      imports: [ConfigModule], //?inyecciones
      inject: [ConfigService], //?inyecciones
      useFactory: (configService: ConfigService) => {
        // console.log('JWT Secret', configService.get('JWT_SECRET') ) //? garantiza el tipo de dato y ofrece mas opciones de configuracion
        // console.log('JWT SECRET', process.env.JWT_SECRET) //?trae un string alojado en los env sin mas
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h'
          }
        }
      }
    })
    // JwtModule.register({
    // secret: process.env.JWT_SECRET,
    // signOptions: {
    //   expiresIn:'2h'
    // }
    // })

  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule { }
