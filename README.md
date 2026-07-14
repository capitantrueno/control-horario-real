# Instalar script

- Primero instalamos el complemento para chrome Tampermonkey:
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo/related?hl=es

- Una vez esté instalado, verás el complemento en el navegador arriba a la derecha

![](https://github.com/juanmafn/control-horario-real/blob/master/images/1.png?raw=true)
- Le damos a agregar nuevo script

![](https://github.com/juanmafn/control-horario-real/blob/master/images/2.png?raw=true)

- Entonces cogemos el código de la siguiente url, lo pegamos y guardamos con control+s
https://raw.githubusercontent.com/juanmafn/control-horario-real/master/ControlHorarioReal.js

- Para enterarte de actualizaciones, es recomendable que añadas la url anterior a la configuración

![](https://github.com/juanmafn/control-horario-real/blob/master/images/3.png?raw=true)


![](https://github.com/juanmafn/control-horario-real/blob/master/images/4.png?raw=true)

# Configuración

El script incluye un objeto `CONFIG` parametrizable al inicio del archivo:

```javascript
const CONFIG = {
  periodoEstival: {
    inicio: { mes: 6, dia: 1 },  // Mes de inicio (0=Enero)
    fin: { mes: 7, dia: 31 }     // Mes de fin
  },
  jornadaNormalHoras: 7.5,
  limiteDescuentoCerditoMinutos: 30
};
```

## Parámetros

- **periodoEstival.inicio/fin**: Define el período de jornada intensiva. Los meses van de 0 (Enero) a 11 (Diciembre).
- **jornadaNormalHoras**: Horas de jornada normal por día (por defecto 7.5).
- **limiteDescuentoCerditoMinutos**: Límite diario de descuento del "cerdito" en minutos (por defecto 30).

## Cambios recientes (v0.9)

- Período estival parametrizable (antes estaba hardcodeado a julio/agosto)
- El script se ejecuta siempre, no solo en período estival
- Los días laborables totales del mes se obtienen del DOM (incluye vacaciones)
- Límite de descuento del cerdito configurable
