import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';


export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => { // ctx es context, no es un argumento que se mande, pero toca ponerlo

        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if (!user)
            throw new InternalServerErrorException('User not found (request)'); // error 500

        return (!data)
            ? user
            : user[data];
    }
);