import { describe, expect, it } from "vitest";

import {
  parseTurmaNome,
  salasDistintas,
  salasPorSerie,
  seriesDistintas,
} from "./turma-nome";

const NOMES = [
  "1º MED A",
  "1º MED B",
  "9º FUN A",
  "9º FUN AM",
  "9º FUN AV",
  "6º FUN C",
];

describe("turma-nome", () => {
  it("separa serie e sala", () => {
    expect(parseTurmaNome("1º MED A")).toEqual({ serie: "1º MED", sala: "A" });
    expect(parseTurmaNome("9º FUN AM")).toEqual({ serie: "9º FUN", sala: "AM" });
    expect(parseTurmaNome("Unica")).toEqual({ serie: "Unica", sala: "" });
  });

  it("lista series distintas ordenadas", () => {
    expect(seriesDistintas(NOMES)).toEqual(["1º MED", "6º FUN", "9º FUN"]);
  });

  it("lista salas distintas, opcionalmente por serie", () => {
    expect(salasDistintas(NOMES)).toEqual(["A", "AM", "AV", "B", "C"]);
    expect(salasDistintas(NOMES, "9º FUN")).toEqual(["A", "AM", "AV"]);
    expect(salasDistintas(NOMES, "1º MED")).toEqual(["A", "B"]);
  });

  it("mapa serie -> salas", () => {
    const mapa = salasPorSerie(NOMES);
    expect(mapa["1º MED"]).toEqual(["A", "B"]);
    expect(mapa["9º FUN"]).toEqual(["A", "AM", "AV"]);
  });
});
