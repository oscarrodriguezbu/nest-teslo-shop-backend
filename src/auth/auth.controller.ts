import { Controller, Get, Post, Body, UseGuards, Req, Headers, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { IncomingHttpHeaders } from 'http';

import { AuthService } from './auth.service';
import { RawHeaders, GetUser, Auth } from './decorators';
import { RoleProtected } from './decorators/role-protected.decorator';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status') //revalidar el token
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard()) // prevenir o permitir acceso
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User, //aca no se manda ningun argumento al decorador  //? GetUser decorador personalizado para traer algo como el request
    @GetUser('email') userEmail: string, //? GetUser decorador personalizado para traer algo como el request

    @RawHeaders() rawHeaders: string[], //? otro decorador personalizado
    @Headers() headers: IncomingHttpHeaders, // decorador que regresa los headers
  ) {
    // console.log({user: request.user});

    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
      headers
    }
  }

  // @SetMetadata('roles', ['admin','super-user']) // esto no evalua la informacion que devuelve

  @Get('private2') // solo para fines educativos
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin) //? estabkece los roles de manera controlada
  @UseGuards(AuthGuard(), UserRoleGuard) //? UserRoleGuard guard personalizado
  privateRoute2(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }

  @Get('private3') // mejor opcion que la opcion 2
  @Auth(ValidRoles.admin) //? decorador personalizado Auth
  privateRoute3(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }
}
