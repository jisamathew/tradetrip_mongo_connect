const mongoose = require('mongoose');

const cooSchema = new mongoose.Schema({
  orderNumber:String,
  exporterName: String,
  exporterAddress: String,
  exporterContact: String,
  importerName: String,
  importerAddress: String,
  importerContact: String,
  productDescription: String,
  hsCode: String,
  quantity: String,
  weight: String,
  countryOfOrigin: String,
  preferentialTariffTreatment: Boolean,
  countryOfOriginStatement: String,
  issuingAuthorityName: String,
  issuingAuthorityAddress: String,
  signatoryName: String,
  designation: String,
  phone: String,
  email: String,
  website: String,
  signature: String,
  digitalSignature: String,
  dateOfIssue: Date,
  certificateNumber: String,
  certificateValidityPeriod: String,
  additionalInformation: String,
  status: { type: String, default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('COO', cooSchema);
