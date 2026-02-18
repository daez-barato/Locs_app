import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios';
import  * as SecureStore from 'expo-secure-store';
import axiosInstance from "../utils/axiosInstance";
import { Platform } from "react-native";

interface AuthProps{
    authState?: {token: string | null; authenticated: boolean | null; userName?: string | null; email?: string | null; id?: string | null};
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
        id: string;
    }>({
        token: "",
        authenticated: false,
        userName: "",
        email: "",
        id: "",
    });

    useEffect(() => {
        
        const loadToken = async () => {
            if (!(Platform.OS === 'web')){
                const token = await SecureStore.getItemAsync("auth_token");
                const username = await SecureStore.getItemAsync("user_name");
                const email = await SecureStore.getItemAsync("email");
                const id = await SecureStore.getItemAsync("id");

                if (token) {

                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
                    setAuthState({
                        token: token,
                        authenticated: true,
                        userName: username as string,
                        email: email as string,
                        id: id as string,
                    });
                }
            }
        }
        
        loadToken();
    }, []);

    const register = async (username: string, email: string, password: string) => {
        try {
            const result = await axiosInstance.post(`/auth/register`, {
                username,
                email,
                password,
            });
    
            const token = result.data.user.token;
            const usernameResult = result.data.user.userName;
            const emailResult = result.data.user.email;
            const idResult = result.data.user.id;
    
            setAuthState({
                token: token,
                authenticated: true,
                userName: usernameResult,
                email: emailResult,
                id: idResult,
            });

            if (!(Platform.OS === 'web')){
                await SecureStore.setItemAsync("auth_token", token);
                await SecureStore.setItemAsync("user_name", usernameResult);
                await SecureStore.setItemAsync("email", emailResult);
                await SecureStore.setItemAsync("id", idResult.toString());
            } else {
                localStorage.setItem("auth_token", token);
                localStorage.setItem("user_name", usernameResult);
                localStorage.setItem("email", emailResult);
                localStorage.setItem("id", idResult.toString());
            }
    
            return result.data;
    
        } catch (err: any) {
            const message = err?.response?.data?.error || err?.response?.data?.message || "Unexpected register error";
            return { error: true, msg: message };
        }
    };
    
    const login = async (email: string, password: string) => {
        try {
            const result = await axiosInstance.post(`/auth/login`, { email, password });

            if (result.status !== 200){
                throw new Error(`Login error: ${result.data.error}`);
            }
    
            const token = result.data.user.token;
            const usernameResult = result.data.user.username;
            const emailResult = result.data.user.email;
            const idResult = result.data.user.id;
    
            setAuthState({
                token: token,
                authenticated: true,
                userName: usernameResult,
                email: emailResult,
                id: idResult,
            });

            
            if (!(Platform.OS === 'web')){
                await SecureStore.setItemAsync("auth_token", token);
                await SecureStore.setItemAsync("user_name", usernameResult);
                await SecureStore.setItemAsync("email", emailResult);
                await SecureStore.setItemAsync("id", idResult.toString());
            } else {
                localStorage.setItem("auth_token", token);
                localStorage.setItem("user_name", usernameResult);
                localStorage.setItem("email", emailResult);
                localStorage.setItem("id", idResult.toString());
            };
            
            return result.data;
    
        } catch (err: any){
            const message = err?.response?.data?.error || err?.response?.data?.message || "Unexpected login error";
            return { error: true, msg: message };
        }
    };
    

    const logout = async () => {
        if (!(Platform.OS === 'web'))
            await SecureStore.deleteItemAsync("auth_token");

        setAuthState({
            token: "",
            authenticated: false,
            userName: "",
            email: "",
            id: "",
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