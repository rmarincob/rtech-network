require("dotenv").config();

const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

const Users = require("./entities/Users");
const { AppDataSource } = require('./database/postgres');

class MCContract extends Contract {
  constructor() {
    super("MCContract");
  }

  async instantiate() {
    await AppDataSource.initialize().then(() => {
      console.log('Connection to the DB established successfully.');
    }).catch((error) => console.error(`Error while connecting to PostgreSQL: ${error}`));
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  encryptData(data, key) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  }

  decryptData(encryptedData, key) {
    const [iv, encrypted] = encryptedData.split(":");

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
  async getPatient(ctx, dni) {
    const userPg = await Users.findOne({ where: { document: dni } });

    const dniMask = generateMaskValue(dni, 2, 3)
    const buffer = await ctx.stub.getState(dniMask);
    if (!buffer || !buffer.length)
      return { success: false, message: `The patient with ID ${patientId} does not exist` };

    const payload = JSON.parse(this.decryptData(buffer.toString(), userPg.encryptionKey));
    return { success: true, payload };
  }

  async setPatient(ctx, dni, email, birthday, gender, bloodType, height) {
    let encryptionKey = this.generateEncryptionKey()

    const userPg = await Users.findOne({ where: { document: dni } });
    if (userPg) {
      encryptionKey = userPg.encryptionKey
    } else {
      const user = new Users();
      user.document = dni;
      user.encryptionKey = encryptionKey;

      await user.save()
    }

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

    const buffer = Buffer.from(this.encryptData(JSON.stringify(newPatient), encryptionKey));
    await ctx.stub.putState(dniMask, buffer);

    const message = `Patient ${dni} is registered successfully!`;
    return { success: true, message };
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// DOCTOR RELATED CHAINCODE //////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
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

  async setPrescription(ctx, doctorDni, patientDni, diagnosis, medicines, createdAt) {
    const recordId = uuidv4();

    const userPg = await Users.findOne({ where: { document: patientDni } });
    const dniMask = generateMaskValue(dni, 2, 3)
    const newPrescription = {
      recordId,
      doctorDni,
      patientDni: dniMask,
      diagnosis,
      medicines: JSON.stringify(medicines),
      createdAt,
    };

    const buffer = Buffer.from(JSON.stringify(newPrescription));
    await ctx.stub.putState(recordId, buffer);

    // update patient's medical records
    const patient = await this.getPatient(ctx, patientDni);
    if (!patient.success) return patient;

    patient.payload.medicalRecords.push(newPrescription);
    const patientBuffer = Buffer.from(this.encryptData(JSON.stringify(patient.payload), userPg.encryptionKey));
    await ctx.stub.putState(dniMask, patientBuffer);

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
