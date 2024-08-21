import express from "express";
import db from "@repo/db/client"
const app = express();

app.post("/hdfcWebhook", async (req, res) => {
    //TODO: Add zod validation here?

    // check if the reqruest actually came from the hdfc bank hook ? 

    // THEN 
    const paymentInformation = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount
    };

    // Transaction Start
    try {
        await db.$transaction([
            db.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId)
                },
                data: {
                    amount: {
                        // We use increament because if two requests come then balence will be broke and balence will be broke  so use increment 
                        increment: Number(paymentInformation.amount)
                    }
                }
            }),
            db.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token
                },
                data: {
                    status: "Success",
                }
            })
        ]);

        //  This is too much important as if status code / res is negative the hdfc bank will refund the money 
        res.json({
            message: "Captured"
        })
        // Transaction End
    } catch (e) {
        console.error(e);
        //  This is too much important as if status code / res is negative the hdfc bank will refund the money 
        db.onRampTransaction.update({
            where: {
                token: paymentInformation.token
            },
            data: {
                status: "Failure"
            }
        })
        res.status(411).json({
            message: "Error while processing webhook"
        })
    }

})



app.listen(3003)