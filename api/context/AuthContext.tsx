import { createContext, useContext, useEffect, useState } from "react";
import { AxiosError } from 'axios';
import  * as SecureStore from 'expo-secure-store';
import { SERVER_PORT } from "../config";
import axiosInstance from "../utils/axiosInstance";

interface AuthProps{
    authState?: {token: string | null; authenticated: boolean | null; userName?: string | null; email?: string | null};
    onRegister?: (username: string, email: string, password: string) => Promise<any>;
    onLogin?: (email: string, password: string) => Promise<any>;
    onLogout?: () => Promise<any>;
}


const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
    return useContext(AuthContext);
};


export const AuthProvider = ({children}: any) => {
    const [authState, setAuthState] = useState<{
        token: string;
        authenticated: boolean;
        userName: string;
        email: string;
    }>({
        token: "",
        authenticated: false,
        userName: "",
        email: "",
    });

    /* useEffect(() => {
        const loadToken = async () => {
            console.log("Stored token:", authState.token);
            const token = await SecureStore.getItemAsync("auth_token");
            const username = await SecureStore.getItemAsync("user_name");
            const email = await SecureStore.getItemAsync("email");

            if (token) {

                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                console.log("Stored token:", token);
                setAuthState({
                    token: token,
                    authenticated: true,
                    userName: username,
                    email: email,
                });
            }
        }
        loadToken();
    }, []); */

    const register = async (username: string, email: string, password: string) => {
        try {
            const result = await axiosInstance.post(`${SERVER_PORT}/auth/register`, {
                username,
                email,
                password,
            });
    
            const token = result.data.user.token;
            const usernameResult = result.data.user.userName;
            const emailResult = result.data.user.email;
    
            setAuthState({
                token: token,
                authenticated: true,
                userName: usernameResult,
                email: emailResult,
            });
    
            await SecureStore.setItemAsync("auth_token", token);
            await SecureStore.setItemAsync("user_name", usernameResult);
            await SecureStore.setItemAsync("email", emailResult);
    
            return result.data;
    
        } catch (err) {
            return { error: true, msg: (err as AxiosError).message };
        }
    };
    
    const login = async (email: string, password: string) => {
        try {
            const result = await axiosInstance.post(`${SERVER_PORT}/auth/login`, { email, password });
    
            const token = result.data.user.token;
            const usernameResult = result.data.user.username;
            const emailResult = result.data.user.email;
    
            setAuthState({
                token: token,
                authenticated: true,
                userName: usernameResult,
                email: emailResult,
            });
    
            await SecureStore.setItemAsync("auth_token", token);
            await SecureStore.setItemAsync("user_name", usernameResult);
            await SecureStore.setItemAsync("email", emailResult);
    
            return result.data;
    
        } catch (err) {
            return { error: true, msg: (err as AxiosError).message };
        }
    };
    

    const logout = async () => {
        await SecureStore.deleteItemAsync("auth_token");

        setAuthState({
            token: "",
            authenticated: false,
            userName: "",
            email: "",
        });
    };

    const value = {
        authState: authState,
        onRegister: register,
        onLogin: login,
        onLogout: logout,

    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}