
export default async () => {
  try {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/VRLA.PA?range=1y&interval=1d";

    const respuesta = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!respuesta.ok) {
      throw new Error("Error consultando Yahoo Finance");
    }

    const json = await respuesta.json();
    const resultado = json.chart.result[0];

    const meta = resultado.meta;
    const cotizaciones = resultado.indicators.quote[0];
    const fechas = resultado.timestamp;

    const ultimoIndice = cotizaciones.close.length - 1;

    const ultimoPrecio = meta.regularMarketPrice;
   const cierresValidos = cotizaciones.close.filter(
  v => v !== null
);

const cierreAnterior = cierresValidos[cierresValidos.length - 2];

const variacion = ultimoPrecio - cierreAnterior;
const porcentaje = (variacion / cierreAnterior) * 100;

    const maximos = cotizaciones.high.filter(v => v !== null);
    const minimos = cotizaciones.low.filter(v => v !== null);

    const fecha = new Date(
      meta.regularMarketTime * 1000
    ).toISOString().slice(0, 10);

    const maximo52 = Math.max(...maximos);
    const minimo52 = Math.min(...minimos);

    const ultimoMaximo = cotizaciones.high[ultimoIndice];
    const ultimoMinimo = cotizaciones.low[ultimoIndice];
    const volumen = cotizaciones.volume[ultimoIndice];

    return new Response(JSON.stringify({
      empresa: "Verallia",
      simbolo: "VRLA.PA",
      cotizacion: Number(ultimoPrecio.toFixed(2)),
      variacion: Number(variacion.toFixed(2)),
      cierreAnterior: Number(cierreAnterior.toFixed(2)),
      porcentaje: Number(porcentaje.toFixed(2)),
      maximoSesion: ultimoMaximo,
      minimoSesion: ultimoMinimo,
      maximo52: Number(maximo52.toFixed(2)),
      minimo52: Number(minimo52.toFixed(2)),
      volumen: volumen,
      fecha: fecha,
      capitalizacion: null,
      fuente: "Yahoo Finance"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "No se han podido obtener los datos de Verallia"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
