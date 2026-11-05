
exports.handler = async function () {
  const SERIE = "D_DNBAF172";

  const url =
    "https://app.bde.es/bierest/resources/srdatosapp/listaSeries" +
    "?idioma=es&series=" + SERIE + "&rango=12M";

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Banco de España: HTTP " + response.status);
    }

    const data = await response.json();

    const serie = Array.isArray(data)
      ? data.find(item => item.serie === SERIE) || data[0]
      : data;

    if (!serie || !serie.fechas || !serie.valores) {
      throw new Error("No se ha encontrado el histórico de la serie");
    }

    const datos = serie.fechas.map((fecha, i) => ({
      fecha: fecha.substring(0, 10),
      valor: Number(serie.valores[i])
    })).filter(d =>
      Number.isFinite(d.valor) && d.valor > 0
    );

    if (!datos.length) {
      throw new Error("No hay datos disponibles");
    }

    const ultimo = datos[datos.length - 1];

    function media(lista) {
      if (!lista.length) return null;

      return Number(
        (lista.reduce((s, d) => s + d.valor, 0) /
        lista.length).toFixed(3)
      );
    }

    const mesActual = ultimo.fecha.substring(0, 7);
    const mesAnterior = new Date(
      Number(mesActual.substring(0, 4)),
      Number(mesActual.substring(5, 7)) - 2,
      1
    ).toISOString().substring(0, 7);

    const anioActual = ultimo.fecha.substring(0, 4);

    const mediaMes = media(
      datos.filter(d => d.fecha.startsWith(mesActual))
    );

    const mediaMesAnterior = media(
      datos.filter(d => d.fecha.startsWith(mesAnterior))
    );

    const mediaAnual = media(
      datos.filter(d => d.fecha.startsWith(anioActual))
    );

    const meses = {};

    datos.forEach(d => {
      const mes = d.fecha.substring(0, 7);

      if (!meses[mes]) meses[mes] = [];
      meses[mes].push(d);
    });

    const grafica = Object.keys(meses)
      .sort()
      .slice(-12)
      .map(mes => ({
        mes,
        valor: media(meses[mes])
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      },
      body: JSON.stringify({
        serie: SERIE,
        ultimoValor: ultimo.valor,
        fecha: ultimo.fecha,
        mediaMensual: mediaMes,
        mediaMesAnterior: mediaMesAnterior,
        mediaAnual: mediaAnual,
        grafica: grafica,
        fuente: "Banco de España"
      })
    };

  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "No se han podido obtener los datos del Euríbor",
        detalle: error.message
      })
    };
  }
};

