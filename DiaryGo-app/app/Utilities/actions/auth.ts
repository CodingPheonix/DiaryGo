"use server"
import { SignupFormSchema, LoginFormSchema } from "../lib/definitions";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, getSession, updateSession } from "../lib/sessions";
import { redirect } from "next/navigation";
import { connect_to_mongo } from "../../api/mongo/connect_to_mongo";
import { auth } from "../../api/mongo/mongo_schema";

/*
    1. sign up is used by useActionState server action of next js. so next js wraps everything inside "signup" into a POST request. Hence, there is no need to route it to another api route as this whole thing is taking place inside a server component. 

    2. "signup" is used in a useActionState server action which needs to be a client component. hence, it is essential to mark it as a server component so that it can be used in a server action.

    3. The signup form schema is used to validate the form data. If the form data is valid, it is send to add data to the database.
*/

export async function fetchSession() {
    const session = await getSession()
    return session
}

interface UserData {
  _id: string;
  email: string;
  password: string;
  username: string;
}

interface State {
  errors: Record<string, string[]>; // each field maps to array of strings
  success: boolean;
  data: UserData | null;
}

export async function signup(prevState: State, formData: FormData) {
    await connect_to_mongo();

    const validatedFields = SignupFormSchema.safeParse({
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
            data: null
        };
    }

    let new_user

    try {
        const present_user = await auth.findOne({ email: validatedFields.data.email });
        if (present_user) {
            return {
                errors: { email: ["User is already present"] },
                success: false,
                data: null
            };
        }

        const hashed_password = await bcrypt.hash(validatedFields.data.password, 10);
        new_user = new auth({
            username: validatedFields.data.username,
            email: validatedFields.data.email,
            password: hashed_password,
        });

        await new_user.save();

    } catch (error) {
        console.error(error);
        return {
            errors: { general: ["Internal server error"] },
            success: false,
            data: null
        };
    }

    await createSession(new_user._id.toString())
    redirect('/My_diary')

    // return {
    //     errors: {},
    //     success: true,
    //     data: validatedFields.data
    // };
}


export async function login(prevState: State, formData: FormData): Promise<State> {
    await connect_to_mongo();

    const validatedFields = LoginFormSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password')
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
            data: null
        };
    }

    let present_user;

    try {
        present_user = await auth.findOne({ email: validatedFields.data.email });
        if (!present_user) {
            return {
                errors: { email: ["User is not present"] },
                success: false,
                data: null
            };
        }

        const isPasswordCorrect = await bcrypt.compare(
            validatedFields.data.password,
            present_user.password
        );

        if (!isPasswordCorrect) {
            return {
                errors: { email: ["Password is incorrect"] },
                success: false,
                data: null
            };
        }
    } catch (error) {
        console.error(error);
        return {
            errors: { general: ["Internal server error"] },
            success: false,
            data: null
        };
    }

    await createSession(present_user._id.toString());

    return {
        errors: {},
        success: true,
        data: {
            ...present_user.toObject(),
            _id: present_user._id.toString() // ✅ Convert to string
        }
    };
}


export async function logout() {
    await deleteSession()
    redirect('/')
}
