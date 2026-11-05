
export default async () => {
  try {
    const base = "https://servicios.ine.es/wstempus/js/ES/DATOS_METADATAOPERACION/IPC";

    async function consultar(variacion, grupo, serie) {
      const parametros = new URLSearchParams({
        g1: "349:16473",
        g2: `3:${variacion}`,
        g3: `${grupo}`,
        p: "1",
        nult: "13"
      });

      const respuesta = await fetch(`${base}?${parametros}`);

      if (!respuesta.ok) {
        throw new Error("Error consultando el INE");
      }

      const datos = await respuesta.json();
      const resultado = datos.find(item => item.COD === serie);

      if (!resultado || !resultado.Data?.length) {
        throw new Error(`No se encontraron datos para ${serie}`);
      }

      return resultado.Data.sort(
        a.Anyo - b.Anyo
          a.FK_Periodo - b.FK_Periodo
      );
    }

    const [anual, mensual, subAnual, subMensual] =
      await Promise.all([
        consultar(74, "762:304092", "IPC290750"),
        consultar(84, "762:304092", "IPC290752"),
        consultar(74, "269:12850", "IPC292510"),
        consultar(84, "269:12850", "IPC292512")
      ]);

    const ultimo = datos => datos[datos.length - 1];
    const anterior = datos => datos[datos.length - 2];

    const actual = ultimo(anual);

    const mes = new Date(
      Date.UTC(actual.Anyo, actual.FK_Periodo - 1, 1)
    ).toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });

    const historial = anual.slice(-12).map(dato => {
      const sub = subAnual.find(item =>
        item.Anyo === dato.Anyo &&
        item.FK_Periodo === dato.FK_Periodo
      );

      return {
        periodo: `${dato.Anyo}-${String(dato.FK_Periodo).padStart(2, "0")}`,
        ipc: dato.Valor,
        subyacente: sub?.Valor ?? null
      };
    });

    return new Response(JSON.stringify({
      pais: "España",
      periodo: mes,
      tipoDato: actual.FK_TipoDato === 3 ? "Avance" : "Definitivo",
      ipcAnual: ultimo(anual).Valor,
      ipcMensual: ultimo(mensual).Valor,
      subyacenteAnual: ultimo(subAnual).Valor,
      subyacenteMensual: ultimo(subMensual).Valor,
      anterior: {
        ipcAnual: anterior(anual)?.Valor ?? null,
        ipcMensual: anterior(mensual)?.Valor ?? null,
        subyacenteAnual: anterior(subAnual)?.Valor ?? null,
        subyacenteMensual: anterior(subMensual)?.Valor ?? null
      },
      historial,
      fuente: "Instituto Nacional de Estadística (INE)"
    }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
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
