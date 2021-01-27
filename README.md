# Fafago Infrastructure

Este repositorio aloja tanto un docker-compose con los distintos microservicios de la aplicación así como sus bases de datos configurados en red como los tests de integración.

## Tests de integración

Estos tests están configurados para ejecutarse en el CI de los demás componentes pero pueden ser lanzados desde este propio repositorio. Para ello será necesario instalar las dependencias y ejecutar el comando de test:

`
npm i
`

`
npm run test
`

Esto levantara la infraestructura de test, correrá las pruebas y apagará de nuevo la infraestructura con un único comando.
