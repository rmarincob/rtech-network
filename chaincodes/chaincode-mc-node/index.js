const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

class MCContract extends Contract {
  constructor() {
    super("MCContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// PATIENT RELATED CHAINCODE /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async getAllPatient(ctx) {
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const key = result.value.key
      if (result.value && key.endsWith('|patient')) {
        const strValue = result.value.value
        allResults.push({ key, value: strValue });
      }

      result = await iterator.next();
    }

    return JSON.stringify(allResults);
  }

  async getPatient(ctx, key) {
    const allResults = [];

    const buffer = await ctx.stub.getState(`${key}|patient`);
    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${key} does not exist` };

    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const key = result.value.key
      if (result.value && key.endsWith(`${key}|prescription`)) {
        const strValue = result.value.value
        allResults.push({ key, value: strValue });
      }

      result = await iterator.next();
    }

    return { success: true, payload: buffer, prescriptions: allResults };
  }

  async setPatient(ctx, key, value) {
    await ctx.stub.putState(`${key}|patient`, value);

    const message = `Patient ${key} is registered successfully!`;
    return { success: true, message };
  }

  async deletedPatient(ctx, key) {
    const buffer = await ctx.stub.getState(`${key}|patient`);
    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${key} does not exist` };

    await ctx.stub.deleteState(`${key}|patient`);
    return `The patient ${key} deleted successfully!`;
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// PRESCRIBE MEDICINE ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async getAllPrescription(ctx) {
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const key = result.value.key
      if (result.value && key.endsWith('`|prescription')) {
        const strValue = result.value.value
        allResults.push({ key, value: strValue });
      }

      result = await iterator.next();
    }

    return JSON.stringify(allResults);
  }

  async getPrescription(ctx, id) {
    const buffer = await ctx.stub.getState(id);

    if (!buffer || !buffer.length)
      return { success: false, message: `The prescription with ID ${id} does not exist` };

    const payload = JSON.parse(buffer.toString());
    return { success: true, payload }
  }

  async setPrescription(ctx, document, reason, diagnosis, medicines, observations, createdAt) {
    const id = uuidv4();

    const prescription = {
      document,
      reason,
      diagnosis,
      medicines: JSON.stringify(medicines),
      observations: JSON.stringify(observations),
      createdAt,
    };

    const buffer = Buffer.from(JSON.stringify(prescription));
    await ctx.stub.putState(`${id}|${document}|prescription`, buffer);

    const message = `Prescription ${id} is registered successfully!`;
    return { success: true, message };
  }
}

exports.contracts = [MCContract];
