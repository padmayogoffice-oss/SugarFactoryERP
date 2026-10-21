const COMPUTED = {
  sugarFromCane: (doc) => {
    const cane = Number(doc.caneCrushedMt || 0);
    const sugar = Number(doc.sugarProducedMt || 0);
    if (!cane) return 0;
    return Number(((sugar / cane) * 100).toFixed(3));
  },
  plannedSugar: (doc) => {
    const cane = Number(doc.plannedCrushingMt || 0);
    const recovery = Number(doc.plannedRecoveryPercent || 0);
    return Number(((cane * recovery) / 100).toFixed(3));
  },
  netWeight: (doc) => {
    const gross = Number(doc.grossWeightMt || 0);
    const tare = Number(doc.tareWeightMt || 0);
    if (!gross && !tare) return 0;
    return Number((gross - tare).toFixed(3));
  },
  purity: (doc) => {
    const pol = Number(doc.polPercent || 0);
    const brix = Number(doc.brixPercent || 0);
    if (!brix) return 0;
    return Number(((pol / brix) * 100).toFixed(3));
  },
  caneRecovery: (doc) => {
    const pol = Number(doc.polPercent || 0);
    const brix = Number(doc.brixPercent || 0);
    const fibre = Number(doc.fibrePercent || 12);
    if (!brix) return 0;
    const purity = (pol / brix) * 100;
    return Number((purity * (1 - fibre / 100)).toFixed(3));
  },
  powerConsumed: (doc) =>
    Number((Number(doc.generatedKwh || 0) - Number(doc.exportedKwh || 0)).toFixed(3)),
};

const FIELD_COMPUTATIONS = {
  recoveryPercent: COMPUTED.sugarFromCane,
  plannedSugarMt: COMPUTED.plannedSugar,
  netWeightMt: COMPUTED.netWeight,
  purityPercent: COMPUTED.purity,
  consumedKwh: COMPUTED.powerConsumed,
};

function applyComputed(input) {
  const plain = typeof input.toObject === 'function' ? input.toObject({ virtuals: true }) : { ...input };
  for (const [field, computation] of Object.entries(FIELD_COMPUTATIONS)) {
    plain[field] = computation(plain);
  }
  return plain;
}

export { applyComputed };
