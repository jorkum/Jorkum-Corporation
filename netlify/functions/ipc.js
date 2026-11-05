
export default async () => {
  try {
    const url =
      "https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736176802&idp=1254735976607";

    const respuesta = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!respuesta.ok) {
      throw new Error("Error consultando el INE");
    }

    const html = await respuesta.text();

    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&aacute;/gi, "á")
      .replace(/&eacute;/gi, "é")
      .replace(/&iacute;/gi, "í")
      .replace(/&oacute;/gi, "ó")
      .replace(/&uacute;/gi, "ú")
      .replace(/&ntilde;/gi, "ñ")
      .replace(/&iquest;/gi, "¿")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ");

    const periodo = texto.match(
      /Base 2025\s*(?:-|–)?\s*(Avance|Definitivo)?[.:]?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(20\d{2})/i
    );

    const tabla = texto.match(
      /Indicador\s+Nota\s+Variación mensual\s+Variación anual([\s\S]{0,500})/i
    );

    if (!periodo || !tabla) {
      throw new Error("No se han localizado los datos del IPC");
    }

    const general = tabla[1].match(
      /[ÍI]ndice general\s+(-?\d+[,.]?\d*)\s+(-?\d+[,.]?\d*)/i
    );

    const subyacente = tabla[1].match(
      /Inflación subyacente\s+\d*\s*(-?\d+[,.]?\d*)\s+(-?\d+[,.]?\d*)/i
    );

    if (!general || !subyacente) {
      throw new Error("No se han podido leer los indicadores");
    }

    const numero = valor =>
      Number(valor.replace(",", "."));

    return new Response(JSON.stringify({
      pais: "España",
      ipcMensual: numero(general[1]),
      ipcAnual: numero(general[2]),
      subyacenteMensual: numero(subyacente[1]),
      subyacenteAnual: numero(subyacente[2]),
      periodo: periodo[2] + " " + periodo[3],
      tipoDato: periodo[1] || "Publicado",
      fuente: "Instituto Nacional de Estadística"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      fuente: "INE"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

