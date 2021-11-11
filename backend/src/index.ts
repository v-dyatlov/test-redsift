import express from 'express';
import mongoose from 'mongoose';
import { json } from 'body-parser';
import { authRouter } from './routes/auth';
import { setCurrentUser } from '../middleware/userMiddleware';
import cors from 'cors';
import { config } from './config';

const app = express();
app.use(cors());
app.use(json());
app.use(authRouter);
app.use(setCurrentUser);

const { mongo: { user, password, host, collection }} = config;

mongoose.connect(`mongodb+srv://${user}:${password}@${host}/${collection}?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
}, () => {
  console.log('Connected to database')
})

app.listen(3000, () => {
  console.log('Server is listening on port 3000')
})