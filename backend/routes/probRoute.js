import express from 'express';
import {probValue,gasValue, edgeModelStatus, snapshotValue} from '../controllers/probController.js'
const probRouter = express.Router();

probRouter.post("/value",probValue);
probRouter.post("/gas", gasValue);
probRouter.get("/model-status", edgeModelStatus);
probRouter.post("/snapshot", snapshotValue);


export default probRouter;