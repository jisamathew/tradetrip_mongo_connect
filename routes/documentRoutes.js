const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
// const COO = require('../models/cooModel'); // Import COO schema
const { getDB } = require('../config/db');
// const nodemailer = require('nodemailer');

const mongoose = require('mongoose'); // Import mongoose for Object ID
const crypto = require('crypto');
const pdfLib = require('pdf-lib');
const fs = require('fs');

const router = express.Router();

// File upload settings
const storage = multer.memoryStorage();
const upload = multer({ storage });

const { verifyRole } = require('../middleware/authMiddleware');

// Upload a document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const newDoc = new Document({
            name: req.file.originalname,
            data: req.file.buffer,
            contentType: req.file.mimetype,
        });
        await newDoc.save();
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload file', error: err });
    }
});

// Get all documents
router.get('/documents', async (req, res) => {
    try {
        const documents = await Document.find();
        res.status(200).json(documents);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch documents', error: err });
    }
});

// Serve document by ID
router.get('/document/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.contentType(document.contentType).send(document.data);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch document', error: err });
    }
});
// ---------------- Helper Functions ----------------

// Generate a digital signature
// const generateSignature = (data, privateKey) => {
//     if (!data || typeof data !== 'string') {
//                 throw new Error('Invalid COO content: must be a non-empty string.');
//             }
//             if (!privateKey || typeof privateKey !== 'string') {
//                 throw new Error('Invalid private key: must be a non-empty PEM string.');
//             }

//     const sign = crypto.createSign('SHA256');
//     sign.update(data);
//     sign.end();
//     return sign.sign(privateKey, 'hex');


// //     // Step 2: Sign the hash using the private key
// //     const signature = crypto.sign('sha256', cooHash, {
// //         key: privateKey,
// //         padding: crypto.constants.RSA_PKCS1_PSS_PADDING
// //     });
// };

// // Verify a digital signature
// const verifySignature = (data, signature, publicKey) => {
//     if (!data || typeof data !== 'string') {
//         throw new Error('Invalid COO content: must be a non-empty string.');
//     }
//     if (!signature || typeof signature !== 'string') {
//         throw new Error('Invalid signature: must be a non-empty hex string.');
//     }
//     if (!publicKey || typeof publicKey !== 'string') {
//         throw new Error('Invalid public key: must be a non-empty PEM string.');
//     }
//     const verify = crypto.createVerify('SHA256');
//     verify.update(data);
//     verify.end();
//     return verify.verify(publicKey, signature, 'hex');
// };
// Function to generate a signature
const generateSignature = (data, privateKey) => {
    if (!data || typeof data !== 'string') {
        throw new Error('Invalid COO content: must be a non-empty string.');
    }
    if (!privateKey || typeof privateKey !== 'string') {
        throw new Error('Invalid private key: must be a non-empty PEM string.');
    }

    try {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        // Use RSA_PKCS1_PSS_PADDING for better security
        return sign.sign({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        }, 'hex');
    } catch (error) {
        throw new Error(`Failed to generate signature: ${error.message}`);
    }
};

// Function to verify a signature
// Function to check the format of the public key
function getKeyFormat(publicKey) {
    if (publicKey.includes('BEGIN RSA PUBLIC KEY')) {
      return 'PKCS#1';  // RSA Public Key (PKCS#1)
    }
    return 'PKCS#8';  // Generic Public Key (PKCS#8)
  }
  
  // Function to verify the signature
// Function to verify the signature
function verifySignature(data, signature, publicKey) {
    const keyFormat = getKeyFormat(publicKey);
  
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    verifier.end();
  
    try {
      return verifier.verify({
        key: publicKey,
        format: 'pem',  // Use 'pem' format for both PKCS#1 and PKCS#8
        type: 'pkcs1',  // Specify the type as 'pkcs1' for RSA keys in PKCS#1 format
      }, signature, 'hex');
    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }
  
// const verifySignature = (data, signature, publicKey) => {
//     if (!data || typeof data !== 'string') {
//         throw new Error('Invalid COO content: must be a non-empty string.');
//     }
//     if (!signature || typeof signature !== 'string') {
//         throw new Error('Invalid signature: must be a non-empty hex string.');
//     }
//     if (!publicKey || typeof publicKey !== 'string') {
//         throw new Error('Invalid public key: must be a non-empty PEM string.');
//     }

//     try {
//         const verify = crypto.createVerify('SHA256');
//         // verify.update(data);
//         verify.update(data, 'utf-8');
//         verify.end();
//         // Use RSA_PKCS1_PSS_PADDING for consistency with signing
//         return verify.verify({
//             key: publicKey,
//             padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//         }, signature, 'hex');
//     } catch (error) {
//         throw new Error(`Failed to verify signature: ${error.message}`);
//     }
// };
// const verifySignature = (data, signature, publicKey) => {
//     if (!data || typeof data !== 'string') {
//         throw new Error('Invalid COO content: must be a non-empty string.');
//     }
//     if (!signature || typeof signature !== 'string') {
//         throw new Error('Invalid signature: must be a non-empty hex string.');
//     }
//     if (!publicKey || typeof publicKey !== 'string') {
//         throw new Error('Invalid public key: must be a non-empty PEM string.');
//     }

//     try {
//         const verify = crypto.createVerify('SHA256');
//         verify.update(data, 'utf-8'); // Ensure encoding is specified
//         verify.end();
//         return verify.verify(
//             { key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
//             signature,
//             'hex' // Ensure encoding matches signature format
//         );
//     } catch (error) {
//         throw new Error(`Failed to verify signature: ${error.message}`);
//     }
// };

// ---------------- COO Management ----------------
// const canonicalizeJSON = (json) => {
//     if (typeof json !== 'object' || json === null) {
//         throw new Error('Invalid input: JSON object expected.');
//     }
//     return JSON.stringify(
//         Object.keys(json)
//             .sort() // Sort keys alphabetically
//             .reduce((acc, key) => {
//                 acc[key] = json[key];
//                 return acc;
//             }, {}),
//     );
// };
const canonicalizeJSON = (json) => {
    if (typeof json !== 'object' || json === null) {
        throw new Error('Invalid input: JSON object expected.');
    }

    // Recursive function to handle nested objects and arrays
    const sortKeysRecursively = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(sortKeysRecursively); // Handle arrays recursively
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.keys(obj)
                .sort() // Sort keys alphabetically
                .reduce((acc, key) => {
                    acc[key] = sortKeysRecursively(obj[key]); // Recurse for nested properties
                    return acc;
                }, {});
        }
        return obj; // Return value as is for non-objects (e.g., strings, numbers, etc.)
    };

    return JSON.stringify(sortKeysRecursively(json));
};

// Apply for a COO
router.post('/coo/apply',  async (req, res) => {
// router.post('/coo/apply', verifyRole('exporter'), async (req, res) => {
    try {
        const db = getDB();
        console.log('req')
        console.log(req.user.id)
        const { id } = req.user; // Assuming `req.user` contains authenticated user data
        console.log('gettign user id:' + id)
        // Access form data
        const formData = req.body;
        
        // const encodedPrivateKey = req.headers['x-private-key'];

        // if (!encodedPrivateKey) {
        //     return res.status(400).send({ error: 'Private key is missing' });
        // }

        // // Decode the Base64-encoded private key
        // const privateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf-8');
        // console.log('Decoded Private Key:', privateKey);


        // Sign the COO data
        // const exporterSignature = generateSignature(cooData, privateKey);
        // console.log('Signature:', exporterSignature);
        const newCOO = {
            ...formData,
            exporterId: id,
            // exporterSignature,
            status: 'Pending',
            createdAt: new Date(),
        };

        const result = await db.collection('coo_documents').insertOne(newCOO);
        res.status(201).json({ message: 'COO application submitted successfully', documentId: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting application', error });
    }
});

// Get all pending COO applications
router.get('/coo/pending', async (req, res) => {
    try {
        const db = getDB();
        const pendingApplications = await db.collection('coo_documents').find({ status: 'Pending' }).toArray();
        res.status(200).json(pendingApplications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending applications', error });
    }
});
// const getUserApplications = async () => {
//     try {
//       const token = localStorage.getItem('authToken');
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

//       const response = await axios.get('https://tradetrip-mongo-connect.onrender.com/coo/user-applications');
//       console.log('User Applications:', response.data);
//       // Handle the display of the applications
//     } catch (error) {
//       console.error('Error fetching user applications:', error);
//     }
//   };

router.get('/coo/user-applications', verifyRole('exporter'), async (req, res) => {
    try {
        // Get userId from decoded token
        const { id } = req.user;
        console.log('Exporter ID')
        console.log(id)
        // Get the database instance
        const db = getDB();

        // Find COO applications submitted by this user
        const userApplications = await db.collection('coo_documents')
            .find({ exporterId: id })  // Filter by userId
            .toArray();
        console.log('userApplications')
        console.log(userApplications)
        // Respond with the found applications
        res.status(200).json(userApplications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user applications', error });
    }
});
// Approve a COO application
router.put('/coo/approve/:id', verifyRole('certifier'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        const certifierId = req.user.id;

        // Validate private key from header
        const encodedPrivateKey = req.headers['x-private-key'];
        if (!encodedPrivateKey) {
            return res.status(400).send({ error: 'Private key is missing' });
        }
        const certifierPrivateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf-8');

        // Fetch COO document from the database
        const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (!coo) {
            return res.status(404).json({ message: 'COO application not found' });
        }

        // Fetch logged-in user's details
        const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(certifierId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Combine `formData` and COO data for signing
        const formData = req.body;
        const { _id, status, ...updateFields } = formData;
        const dataToSign = {
            ...updateFields,
            certifierId,
            updatedAt: new Date().toISOString(), // Fixed timestamp for signing
        };

        console.log('Data to sign:', dataToSign);

        // Canonicalize data
        const canonicalizedData = canonicalizeJSON(dataToSign);
console.log('canonicalizedData')
console.log(canonicalizedData)
        // Generate certifier's signature
        const certifierSignature = await generateSignature(canonicalizedData, certifierPrivateKey.trim());

        // Final data to save
        const finalDataToSave = {
            ...updateFields,
            certifierId,
            updatedAt: new Date().toISOString(),
        };

        // Update the COO document with new data and signature
        const updatedCOO = await db.collection('coo_documents').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            {
                $set: {
                    ...finalDataToSave,
                    status: 'Approved',
                    certifierName: `${user.firstname} ${user.lastname}`,
                    certifierSignature,
                },
            },
            { returnDocument: 'after' }
        );

        if (!updatedCOO) {
            return res.status(404).json({ message: 'COO application could not be updated' });
        }

        res.status(200).json({ message: 'COO approved successfully' });
    } catch (error) {
        console.error('Error approving COO:', error);
        res.status(500).json({ message: 'Error approving COO', error: error.message });
    }
});
router.post('/coo/trialrun/:id', verifyRole('certifier'), async (req, res) => {
// Example usage
const data = JSON.stringify({
    "additionalInformation": "Nil",
    "certificateNumber": "COO0392",
    "certificateValidityPeriod": "2 years",
    "certifierId": "67894e70264156f87c2f934a",
    "countryOfOrigin": "Singapore",
    "countryOfOriginStatement": "COuntry of origin statement",
    "createdAt": "2025-01-20T04:23:21.182Z",
    "designation": "employee",
    "email": "ming.hui@mail.com",
    "exporterAddress": "address",
    "exporterContact": "98988987",
    "exporterId": "6789065d264156f87c2f9348",
    "exporterName": "wartsila",
    "hsCode": "88990",
    "importerAddress": "address",
    "importerContact": "625456667",
    "importerName": "qatar shipping ",
    "issuingAuthorityAddress": "singapore address",
    "issuingAuthorityName": "singapore chamber of commerce",
    "orderNumber": "ORDER2",
    "phone": "9074738676",
    "preferentialTariffTreatment": true,
    "productDescription": "wartsila propeller",
    "quantity": "1",
    "signatoryName": "Jennifer",
    "updatedAt": "2025-01-20T04:26:58.596Z",
    "website": "https://www.kottackal.org/",
    "weight": "90"
  });
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDS4cywI2wu27+E
zZuscCVxAQ1+uPdd7Be7dBv/NmL/8cDK/Bui9g5tQTbe239WoUHGoxEs5Z5QQOEM
fIR0VCRFxm0qKWUwP/uua052v0gUnJSaR3JGVJ965AmHIm3qaP9MvQVmpdbtSu2C
q2bvnii3NKzAO7xf75xyi5My9XWwYBJ6gE0ZucB0e9kYU6AxcZ3ByKrBR7THKg1a
et/aRvZgF8RisJHUGBbOBXhJDJd7/mDyBr9zG9rumVLZY0wW7W8deABDzw1XL0tn
i6ADVt6KSQ7Kgli9ndPptb/ABpeX7ccy7aIvZmz2sQ8jV2aVjf+alRlezR+MVEzi
rHSZP4YDAgMBAAECggEAOWHZ2b/5yxJendt41cY6WfKIYoggP31jw81HZP2+mJiG
9nT9bC16JX6OWLvvfXoptMxgexAMMRhGZKhpPmI68IWa5NMYxrVSXdazJhrMmVc2
FHkGfl6+eqkccpoKwLNLbO0uUA0mW7F8yYasXt1xhNCfhTt7+brwnjaemkoyeQhc
l2te/LlslfUHrmV/YGeTxER0O8fCX8It7X6bO/Ck6ernO4ld3fpQOGm0w+9ekC4W
56ft2LAuvv5zVArdPgkB2sIR9JsK3B5TS8o1XD5W2swRw88JBtRHz7QJ+r0ug11v
B2MsrhEM85WwqXpDp70eEaVIYpK7Ta9go8c9iUPScQKBgQD5wzEdLPdWGSvP6ul1
tnYZDBAEbiJszl2TjqJtkB0bBD2ZUs4Nr92ekp7fxN4SgI5JPK/Et3tdwfD0O23+
wUkzu4J0g4hGuSux06uCfOHVEUqr4BSH50xIA/SgyFQfmL3oGWirCdTpCgT5gMi+
gsTnuKaM+G9xtLcKaW470LQmOwKBgQDYJgh7Iac4y91TtF4J89O1WSPc8ZnJlFTm
U+1WY6kTnA1fLiMudqeRYvrMZuUOQUvYD2TEi/du9cYuYDLPmNI+HRGSX6LJjstv
g79A7vu0JGJOav+2T3Hv+85yhOxf9UD6O+XOWGBGqS2fyf4cKl/tpv9xvnL0n26K
4UrzVsl62QKBgQDrMWXEhZ171EQvjJS/pkxblcJXiaadM09nLj/CUJ033axr/0/O
D7fwJT26llZQsgJK8PzLj8R6K7FNK9GOvlDCiGZ2dY4UmzaMRDkTramzzI62f1KW
D7cDccYgycR95IWgVJz9w0pdEHRSx3VCAT6OvpEH2sKHHpfnFBUb+pJKFQKBgQCN
FIYEmHqlP6s+r0OSC2vrujsGQ0u1nvOrQqxu7q209u5jaaHc+eV1p707HQ30t/nh
FGsZPqJJ8nFgY7nGdmED2cVWXMXL+UAfkUaMA3CWrAjeVkiBnmkn0pt1c/00xMec
jOv6OwTcGiCFYzpQ9/eVDqM8gqpVsJpeW56oJcVsQQKBgGPFAoMb7xyh9DjjjSM3
JILv7UX18zfowwV0X2FI3hIcj3hFVdMFYq2br4JfTZOMKET5GMrWqTvFfQPbVYfl
5zah5bqoXTsc0nPSN0iBakTHeMI4d11eT+Mf/oPCQySCZ4v9zk9yeEzMMfeTOKdm
cwwXD30UpQeGfD9HRz+UGMq9
-----END PRIVATE KEY-----`;
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0uHMsCNsLtu/hM2brHAl
cQENfrj3XewXu3Qb/zZi//HAyvwbovYObUE23tt/VqFBxqMRLOWeUEDhDHyEdFQk
RcZtKillMD/7rmtOdr9IFJyUmkdyRlSfeuQJhyJt6mj/TL0FZqXW7Urtgqtm754o
tzSswDu8X++ccouTMvV1sGASeoBNGbnAdHvZGFOgMXGdwciqwUe0xyoNWnrf2kb2
YBfEYrCR1BgWzgV4SQyXe/5g8ga/cxva7plS2WNMFu1vHXgAQ88NVy9LZ4ugA1be
ikkOyoJYvZ3T6bW/wAaXl+3HMu2iL2Zs9rEPI1dmlY3/mpUZXs0fjFRM4qx0mT+G
AwIDAQAB
-----END PUBLIC KEY-----`;
try {
    const signature = generateSignature(data, privateKey.trim());
    console.log('Generated Signature:', signature);

    const isValid = verifySignature(data, signature, publicKey.trim());
    console.log('Is the signature valid?', isValid);
} catch (error) {
    console.error(error.message);
}


})
// router.put('/coo/approve/:id', verifyRole('certifier'), async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log('id inside endpoint')
//         console.log(id)
//         const db = getDB();
//         const certifierId = req.user.id;
//         console.log('certifierId')
//         console.log(certifierId)
//         console.log(req.user.id)
//         // Validate private key from header
//         const encodedPrivateKey = req.headers['x-private-key'];
//         if (!encodedPrivateKey) {
//             return res.status(400).send({ error: 'Private key is missing' });
//         }
//         const certifierPrivateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf-8');
//         console.log('certifierPrivateKey')
//         console.log(certifierPrivateKey)
//         // Fetch COO document from the database
//         const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });
//         if (!coo) {
//             return res.status(404).json({ message: 'COO application not found' });
//         }
//         console.log('coo')
//         console.log(coo)
//         const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(certifierId) });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         console.log('details of loggeding user-certifier')
//         console.log(user)
//         // Validate formData and combine it with the COO data
//         const formData = req.body;
//         console.log(formData)
//         const { _id, status, ...updateFields } = formData;
//         const dataToSign = JSON.stringify({
//             ...updateFields,
//             certifierId, // Include certifierId at the time of signing
//             updatedAt: new Date().toISOString(), // Include a fixed timestamp for signing
//         });
//         // Ensure `dataToSign` is a proper object before canonicalization
//         console.log('Data to sign:', dataToSign);
//         // console.log('Raw dataToSign:', dataToSign);
//         console.log('Type of dataToSign:', typeof dataToSign);
//         if (typeof dataToSign !== 'object' || dataToSign === null) {
//             throw new Error('Data to sign is not a valid JSON object');
//         }
//         const parsedDataToSign = typeof dataToSign === 'string' ? JSON.parse(dataToSign) : dataToSign;


//         const canonicalizedData = canonicalizeJSON(parsedDataToSign);
//         // const canonicalizedData = canonicalizeJSON(parsedDataToSign);
//         const finalDataToSave = {
//             ...updateFields,
//             certifierId, // Include certifierId at the time of signing
//             updatedAt: new Date().toISOString(), // Include a fixed timestamp for signing
//         }
//         console.log('dataToSign')
//         console.log(dataToSign)
//         // Generate certifier's signature
//         // const certifierSignature = await generateSignature(dataToSign, certifierPrivateKey);
//         const certifierSignature = await generateSignature(canonicalizedData, certifierPrivateKey);
//         console.log('certifierSignature with coo Data')
//         console.log(certifierSignature)
//         // Update the COO document with new data and signature
//         const updatedCOO = await db.collection('coo_documents').findOneAndUpdate(
//             { _id: new mongoose.Types.ObjectId(id) },
//             {
//                 $set: {
//                     ...finalDataToSave,
//                     status: 'Approved',
//                     certifierName: user.firstname + ' ' + user.lastname,
//                     certifierSignature,
//                     // updatedAt: new Date(),
//                 },
//             },
//             { returnDocument: 'after' }
//         );

//         if (!updatedCOO) {
//             return res.status(404).json({ message: 'COO application could not be updated' });
//         }

//         // res.status(200).json({ message: 'COO approved successfully', coo: updatedCOO.value });
//         res.status(200).json({ message: 'COO approved successfully' });
//     } catch (error) {
//         console.error('Error approving COO:', error);
//         res.status(500).json({ message: 'Error approving COO', error });
//     }
// });

// Get all approved COO applications
router.get('/coo/approved', verifyRole('certifier'), async (req, res) => {
    try {
        const db = getDB();
        const approvedCOOs = await db.collection('coo_documents').find({ status: 'Approved' }).toArray();
        res.status(200).json(approvedCOOs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching approved COOs', error });
    }
});

// Get COO application by ID
router.get('/coo/:id', verifyRole('certifier'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });

        if (!coo) {
            return res.status(404).json({ message: 'COO application not found' });
        }

        res.status(200).json(coo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching COO application', error });
    }
});

// Get COO status by order number
router.get('/coo/status/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const db = getDB();
        const coo = await db.collection('coo_documents').findOne({ orderNumber });

        if (coo) {
            return res.status(200).json({ found: true, status: coo.status, cooDetails: coo });
        } else {
            return res.status(200).json({ found: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// View COO in template
router.get('/coo/view/:id', async (req, res) => {
    try {
        const { id } = req.params;
        //   const coo = await COO.findById(id);
        const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });

        if (!coo) {
            return res.status(404).json({ message: 'COO application not found' });
        }

        // Generate PDF using pdf-lib
        const pdfDoc = await pdfLib.PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();

        // Add COO details
        page.drawText(`Certificate of Origin`, { x: 50, y: height - 50, size: 20 });
        page.drawText(`Exporter: ${coo.exporter}`, { x: 50, y: height - 100 });
        page.drawText(`Certifier: ${coo.certifier}`, { x: 50, y: height - 150 });
        page.drawText(`Status: ${coo.status}`, { x: 50, y: height - 200 });

        // Add signatures
        page.drawText(`Exporter Signature: ${coo.exporterSignature}`, { x: 50, y: height - 300 });
        page.drawText(`Certifier Signature: ${coo.certifierSignature || 'Pending'}`, { x: 50, y: height - 350 });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBytes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating COO template', error });
    }
});
async function fetchPublicKey(userId) {
    try {
        const response = await fetch('http://localhost:4000/get-public-key', {
            // const response = await fetch('https://tradetrip-pki-app.onrender.com/get-public-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch public key');
        }

        const result = await response.json();
        return result.publicKey;
    } catch (error) {
        console.error('Error fetching public key:', error.message);
        throw error;
    }
}

async function verifyCertificate(userId, email) {
    try {
        const response = await fetch('https://tradetrip-pki-app.onrender.com/verify-certificate', {
            // const response = await fetch('http://localhost:4000/verify-certificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Verification failed');
        }

        const result = await response.json();
        console.log('Certificate verification result:', result);

        // Handle successful verification
        return result;
    } catch (error) {
        console.error('Error during certificate verification:', error.message);
        // Handle errors (e.g., show an alert, log the error, etc.)
    }
}
// Verify COO signatures
router.post('/coo/verify/:id', async (req, res) => {
    try {
        const { id } = req.params; // COO Document ID
        const { userId } = req.body; // Extract userId from the request body
        const db = getDB();
        console.log('coo id:',id);
        console.log('userId:',userId)
        // Fetch the COO document
        const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (!coo) {
            return res.status(404).json({ message: 'COO document not found' });
        }

        // Fetch the user details
        const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isCertificateValid = await verifyCertificate(userId, user.email); // Assume this function validates the certificate
        if (!isCertificateValid) {
            return res.status(403).json({ message: 'Invalid certificate' });
        }
        console.log('isCertificateValid')
        console.log(isCertificateValid)
        // Fetch Exporter and Certifier public keys
        // const exporterPublicKey = await fetchPublicKey(coo.exporterId);
        const certifierPublicKey = await fetchPublicKey(coo.certifierId);
        console.log('certifierPublicKey')
        console.log(certifierPublicKey)
        // Filter COO data for signature verification (excluding `_id` and `status`)
        const { _id, status, certifierSignature, certifierName, ...dataForVerification } = coo;
        // console.log('dataForVerification')
        // console.log(dataForVerification)
        const cooDataToVerify = canonicalizeJSON(dataForVerification)
        // const cooDataToVerify = JSON.stringify(dataForVerification);
        console.log('coo.certifierSignature')
        console.log(coo.certifierSignature)
        console.log('cooDataToVerify')
        console.log(cooDataToVerify)
        // Verify Certifier Signature (if present)
        // const isCertifierSignatureValid = coo.certifierSignature
        //     ? verifySignature(
        //         cooDataToVerify,
        //         coo.certifierSignature,
        //         certifierPublicKey.trim()
        //     )
        //     : false;
        // Example: Verify signature
        const isValid = crypto.createVerify('SHA256')
            .update(cooDataToVerify)
            .end()
            .verify({
                key: certifierPublicKey.trim(),
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            }, coo.certifierSignature, 'hex');

        console.log('Verification result:', isValid);
        const isCertifierSignatureValid = verifySignature(
            cooDataToVerify,
            coo.certifierSignature,
            certifierPublicKey.trim()
        );
        console.log('isCertifierSignatureValid')
        // console.log(isCertifierSignatureValid)
        console.log(isCertifierSignatureValid)
        if (!isCertifierSignatureValid) {
            return res.status(403).json({
                message: 'Certifier signature is invalid.',
            });
        }
        // Ensure user is authorized to view the COO document
        // const isAuthorizedUser =
        //     (user.role === 'Exporter' && user.publicKey === coo.exporterPublicKey) ||
        //     (user.role === 'Certifier' && user.publicKey === coo.certifierPublicKey);

        // if (!isAuthorizedUser) {
        //     return res.status(403).json({ message: 'User not authorized to view this COO document' });
        // }

        // Return verification results
        res.status(200).json({
            message: 'Verification Success',
            // exporterSignatureValid: isExporterSignatureValid,
            certifierSignatureValid: isCertifierSignatureValid, verifiedBy: certifierName, certifierPublicKey, timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error verifying COO signatures:', error);
        res.status(500).json({ message: 'Error verifying COO signatures', error });
    }
});

// router.post('/coo/verify/:id', async (req, res) => {
//     try {
//         const { id } = req.params; // COO Document ID
//         const { userId } = req.body; // Extract userId from the request body
// console.log('COO DOC ID,Logged in user id')
// console.log(id,userId)
//         const db = getDB();

//         // Fetch the COO document
//         const coo = await db.collection('coo_documents').findOne({ _id: new mongoose.Types.ObjectId(id) });
//         if (!coo) {
//             return res.status(404).json({ message: 'COO document not found' });
//         }
//         console.log('coo')
//         console.log(coo)

//         // Fetch the user details
//         const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         console.log('userInfo')
//         console.log(user)

//         const exporterPublicKey = await fetchPublicKey(coo.exporterId)
//         const certifierPublicKey = await fetchPublicKey(coo.certifierId)
//         console.log('exporterPublicKey')
//         console.log(exporterPublicKey)
//         console.log('certifierPublicKey')
//         console.log(certifierPublicKey)
//         // Retrieve the COO data as a string for verification
//         const cooData = JSON.stringify(coo);

//         // Verify Exporter Signature
//         const isExporterSignatureValid = verifySignature(
//             cooData,
//             coo.exporterSignature,
//             exporterPublicKey // Public key stored with the COO
//         );
// console.log('isExporterSignatureValid')
// console.log(isExporterSignatureValid)
//         // Verify Certifier Signature (if present)
//         const isCertifierSignatureValid = coo.certifierSignature
//             ? verifySignature(
//                 cooData,
//                 coo.certifierSignature,
//                 certifierPublicKey // Public key stored with the COO
//             )
//             : false;
// console.log('isCertifierSignatureValid')
// console.log(isCertifierSignatureValid)
//         // Check user role (Exporter or Certifier)
//         const isAuthorizedUser =
//             (user.role === 'Exporter' && user.publicKey === coo.exporterPublicKey) ||
//             (user.role === 'Certifier' && user.publicKey === coo.certifierPublicKey);

//         if (!isAuthorizedUser) {
//             return res.status(403).json({ message: 'User not authorized to view this COO document' });
//         }
// console.log('isAuthorizedUser')
// console.log(isAuthorizedUser)
//         // Return signature verification results
//         res.status(200).json({
//             exporterSignatureValid: isExporterSignatureValid,
//             certifierSignatureValid: isCertifierSignatureValid,
//         });
//     } catch (error) {
//         console.error('Error verifying COO signatures:', error);
//         res.status(500).json({ message: 'Error verifying COO signatures', error });
//     }
// });

module.exports = router;
