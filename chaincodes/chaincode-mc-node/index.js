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

  encryptData(data, key) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  }

  decryptData(data, key) {
    const [iv, encrypted] = data.split(":");

    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  generateMaskValue(value, countStart, countEnd, symbol = 'X') {
    const lengthValue = value.length
    const startValue = value.slice(0, countStart)
    const endValue = value.slice(-countEnd)

    const completeValue = symbol.repeat(lengthValue - (countStart + countEnd))

    return `${startValue}${completeValue}${endValue}`
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// PATIENT RELATED CHAINCODE /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async getPatient(ctx, key, dniMask) {
    const buffer = await ctx.stub.getState(dniMask);
    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${patientId} does not exist` };

    const payload = JSON.parse(this.decryptData(buffer.toString(), key));
    return { success: true, payload };
  }

  async setPatient(ctx, key, dni, email, birthday, gender, bloodType, height) {
    const dniMask = generateMaskValue(dni, 2, 3)
    const emailMask = generateMaskValue(email, 3, 4, 'x')

    const newPatient = {
      patientId: uuidv4(),
      dni: dniMask,
      name: faker.person.firstName(),
      lastName: faker.person.lastName(),
      fullname: faker.person.fullName(),
      email: emailMask,
      address: faker.location.streetAddress(),
      secondaryAddress: faker.location.secondaryAddress(),
      birthday,
      gender,
      bloodType,
      height,
      orgName: "patient",
      medicalRecords: [],
    };

    const buffer = Buffer.from(JSON.stringify(newPatient));
    await ctx.stub.putState(dniMask, this.encryptData(buffer, key));

    const message = `Patient ${dni} is registered successfully!`;
    return { success: true, message };
  }

  async setPatient(ctx, dniMask) {
    const buffer = await ctx.stub.getState(dniMask);
    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${patientId} does not exist` };

    await ctx.stub.deleteState(assetId);
    return `The patient ${assetId} deleted successfully!`;
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// DOCTOR RELATED CHAINCODE //////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  async getDoctor(ctx, dni) {
    const buffer = await ctx.stub.getState(dni);

    if (!buffer || !buffer.length)
      return { success: false, message: `The doctor with ID ${dni} does not exist` };

    const payload = JSON.parse(buffer.toString());
    return { success: true, payload };
  }

  async setDoctor(ctx, dni, name, lastName, email, address, contact, specialty) {
    const newDoctor = {
      doctorId: uuidv4(),
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
    await ctx.stub.putState(dni, buffer);

    const message = `Doctor ${dni} is registered successfully!`;
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

  async setPrescription(ctx, key, doctorDni, patientDni, diagnosis, medicines, createdAt) {
    const recordId = uuidv4();

    const newPrescription = {
      recordId,
      doctorDni,
      patientDni,
      diagnosis,
      medicines: JSON.stringify(medicines),
      createdAt,
    };

    const buffer = Buffer.from(JSON.stringify(newPrescription));
    await ctx.stub.putState(recordId, buffer);

    // update patient's medical records
    const patient = await this.getPatient(ctx, key, patientDni);
    if (!patient.success) return patient;

    patient.payload.medicalRecords.push(newPrescription);
    const patientBuffer = Buffer.from(JSON.stringify(patient.payload));
    await ctx.stub.putState(patientDni, this.encryptData(patientBuffer, key));

    // update doctor's prescriptions
    const doctor = await this.getDoctor(ctx, doctorDni);
    if (!doctor.success) return doctor;

    doctor.payload.prescriptions.push(newPrescription);
    const doctorBuffer = Buffer.from(JSON.stringify(doctor.payload));
    await ctx.stub.putState(doctorDni, doctorBuffer);

    const message = `Prescription ${recordId} is registered successfully!`;
    return { success: true, message };
  }
}

exports.contracts = [MCContract];
