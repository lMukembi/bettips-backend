require("dotenv").config({ path: "./config.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const payment = require("./models/payment");

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/user", require("./routes/user"));

const getAccessToken = async (req, res, next) => {
    let MPESA_CONSUMER_KEY = "fiCZBrBN9OBA3hwLsGFfAk4tzAoTjkC3";
    let MPESA_CONSUMER_SECRET = "lIbF9I4jymDLHgC3";

    const auth = new Buffer.from(
        `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    await axios
        .get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        )
        .then((res) => {
            token = res.data.access_token;
            console.log(res.data.access_token);
            next();
        })
        .catch((err) => {
            console.log(err);
        });
};
app.get("/", (req, res) => {
    res.send("api home");
});
//STEP 2 //stk push
app.post("/stk", getAccessToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;

    const date = new Date();
    const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    const shortCode = "174379";
    const passkey =
        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

    const password = new Buffer.from(shortCode + passkey + timestamp).toString(
        "base64"
    );

    return await axios
        .post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: `254${phone}`,
                PartyB: shortCode,
                PhoneNumber: `254${phone}`,
                CallBackURL: "https://mydomain.com/callback",
                AccountReference: `254${phone}`,
                TransactionDesc: "Betika",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
        .then((resp) => {
            return res.json(resp.data);
            // const data = resp.data;
            // console.log(resp.data);
        })
        .catch((err) => {
            res.json(err);
            console.log(err.message);
        });
});

app.post("/confirmation", async (req, res) => {
    console.log("confirmation");
    try {
        const { MSISDN, TransID, TransAmount, FirstName, LastName } = req.body;

        // store to the database

        const transaction = await payment.create({
            MSISDN,
            TransID,
            TransAmount,
            FirstName,
            LastName,
        });

        await transaction
            .save()
            .then((data) => {
                console.log({
                    message: "Transaction saved successfully",
                    data,
                });
            })
            .catch((err) => console.log(err));

        return res.json({
            ResultCode: "0",
            ResultDesc: "Accepted",
        });
    } catch (error) {
        console.log("confirmation error", error);
    }
});

app.post("/validation", async (req, res) => {
    console.log("validation");
    try {
        return res.json({
            ResultCode: "0",
            ResultDesc: "Accepted",
        });
    } catch (error) {
        console.log("validation error", error);
    }
});

//STEP 3 callback url
app.get("/callback", (req, res) => {
    const callbackData = req.body;
    console.log(callbackData.Body);

    if (!callbackData.Body.stkCallback.CallbackMetadata) {
        console.log(callbackData.Body);

        return res.status(200).json("ok");
    }

    const amount = callbackData.Body.stkCallback.CallbackMetadata.Item[0].Value;
    const code = callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;
    const phone = callbackData.Body.stkCallback.CallbackMetadata.Item[4].Value;

    const transaction = new payment();

    transaction.phone = phone;
    transaction.code = code;
    transaction.amount = amount;

    transaction
        .save()
        .then((data) => {
            console.log({ message: "Transaction saved successfully", data });
        })
        .catch((err) => console.log(err.message));

    return res.status(200).json("ok");
});

const MongoDB = async () => {
    await mongoose.connect(
        "mongodb+srv://betikatips:8bYAaqA6msBJnsAp@cluster0.6zwduof.mongodb.net/",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    );
    console.log("Connected to MongoDB");
};

MongoDB();

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

const index = app.listen(process.env.PORT || 8000, () =>
    console.log("listening to port 8000")
);

process.on("unhandledRejection", (error) => {
    console.log(`Logged Error: ${error}`);
    index.close(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
    console.log("logging error", err);
});
