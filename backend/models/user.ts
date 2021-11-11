import mongoose from 'mongoose'

interface IUser {
  username: string;
  password?: string;
  name?: string;
  email: string;
  accountID: number; 
  isAdmin?: boolean;
  isSSO?: boolean;
}

interface userModelInterface extends mongoose.Model<UserDoc> {
  build(attr: IUser): UserDoc
}

interface UserDoc extends mongoose.Document {
	username: string;
	password: string;
	name: string;
	email: string;
	accountID: number; 
	isAdmin: boolean;
	isSSO: boolean;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String, 
    required: false,
  },
  name: {
    type: String, 
    required: false,
  },
  email: {
    type: String, 
    required: false,
  },
  accountID: {
    type: Number, 
    required: false,
  },
  isAdmin: {
    type: Boolean, 
    default: false,
  },
  isSSO: {
	  type: Boolean,
	  default: false,
  },
}, {
	timestamps: true,
});

userSchema.statics.build = (attr: IUser) => {
  return new User(attr)
}

const User = mongoose.model<UserDoc, userModelInterface>('User', userSchema);

export { User, UserDoc }




