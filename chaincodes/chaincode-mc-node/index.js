const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

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
  async patientExists(ctx, patientId) {
    const isPatient = await ctx.stub.getState(patientId);
    return isPatient && isPatient.length > 0;
  }

  async getAllPatients(ctx) {
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");

      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(`getAllPatients: ${err}`);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }

    return { success: true, datasource: JSON.stringify(allResults) };
  }

  async getPatient(ctx, patientId) {
    const buffer = await ctx.stub.getState(patientId);

    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${patientId} does not exist` };

    const payload = JSON.parse(buffer.toString());
    return { success: true, payload };
  }

  async setPatient(ctx, patientId, dni, name, lastName, email, address, birthday, gender, bloodType, height) {
    const newPatient = {
      patientId,
      dni,
      name,
      lastName,
      email,
      address,
      birthday,
      gender,
      bloodType,
      height,
      orgName: "patient",
      medicalRecords: [],
    };

    const buffer = Buffer.from(JSON.stringify(newPatient));
    await ctx.stub.putState(patientId, buffer);

    const message = `Patient ${patientId} is registered successfully!`;
    return { success: true, message };
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// DOCTOR RELATED CHAINCODE //////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async doctorExists(ctx, doctorId) {
    const isDoctor = await ctx.stub.getState(doctorId);
    return isDoctor && isDoctor.length > 0;
  }

  async getAllDoctors(ctx) {
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");

      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(`getAllDoctors: ${err}`)
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }

    return { success: true, datasource: JSON.stringify(allResults) };
  }

  async getDoctor(ctx, doctorId) {
    const buffer = await ctx.stub.getState(doctorId);

    if (!buffer || !buffer.length)
      return { success: false, message: `The doctor with ID ${doctorId} does not exist` };

    const payload = JSON.parse(buffer.toString());
    return { success: true, payload };
  }

  async setDoctor(ctx, doctorId, dni, name, lastName, email, address, contact, specialty) {
    const newDoctor = {
      doctorId,
      dni,
      name,
      lastName,
      email,
      address,
      contact,
      specialty,
      orgName: "doctor",
      prescriptions: []
    };

    const buffer = Buffer.from(JSON.stringify(newDoctor));
    await ctx.stub.putState(doctorId, buffer);

    const message = `Doctor ${doctorId} is registered successfully!`;
    return { success: true, message };

  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// PRESCRIBE MEDICINE ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async getPrescription(ctx, recordId) {
    const buffer = await ctx.stub.getState(recordId);

    if (!buffer || !buffer.length)
      return { success: false, message: `The prescription with ID ${recordId} does not exist` };

    const payload = JSON.parse(buffer.toString());
    return { success: true, payload }
  }

  async setPrescription(ctx, recordId, doctorId, patientId, diagnosis, medicines, createdAt) {
    const newPrescription = {
      recordId,
      doctorId,
      patientId,
      diagnosis,
      medicines: JSON.stringify(medicines),
      createdAt,
    };

    const buffer = Buffer.from(JSON.stringify(newPrescription));
    await ctx.stub.putState(recordId, buffer);

    // update patient's medical records
    const patient = await this.getPatient(ctx, patientId);
    if (!patient.success) return patient;

    patient.payload.medicalRecords.push(newPrescription);
    const patientBuffer = Buffer.from(JSON.stringify(patient.payload));
    await ctx.stub.putState(patientId, patientBuffer);

    // update doctor's prescriptions
    const doctor = await this.getDoctor(ctx, doctorId);
    if (!doctor.success) return doctor;

    doctor.payload.prescriptions.push(newPrescription);
    const doctorBuffer = Buffer.from(JSON.stringify(doctor.payload));
    await ctx.stub.putState(doctorId, doctorBuffer);

    const message = `Prescription ${recordId} is registered successfully!`;
    return { success: true, message };
  }
}

exports.contracts = [MCContract];
