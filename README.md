<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>


# Teslo API

1. Clonar proyecto
2. ```yarn install```
3. Clonar el archivo ```.env.template``` y renombrarlo a ```.env```
4. Cambiar las variables de entorno
5. Levantar la base de datos
```
docker-compose up -d
```

6. Levantar: ```yarn start:dev```

7. Ejecutar SEED 
```
http://localhost:3000/api/seed
```

8. Usar un gesto de base de datos como Table Plus o DBeaber para ver la bd

9. Abrir el swagger en `http://localhost:3000/api/`

10. Para revisar el tema de los websockets hay que correr el proyecto `https://github.com/oscarrodriguezbu/nest-teslo-shop-front` con `yarn run dev` e ingresar al `http://localhost:5173/` entonces abrir dos pestañas con diferentes usuarios



