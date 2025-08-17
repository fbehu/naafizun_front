import React, {useState} from 'react';
import {Eye, EyeOff, Globe} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card} from '@/components/ui/card';
import {toast} from '@/hooks/use-toast';
import axios from "axios";

interface LoginScreenProps {
    onLogin: () => void;
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
}

const apiKey = import.meta.env.VITE_API_URL;

const LoginScreen: React.FC<LoginScreenProps> = ({onLogin, selectedLanguage, onLanguageChange}) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);

    const languages = [
        {name: 'Ўзбекча', code: 'uz'},
        {name: 'Русский', code: 'ru'},
        {name: 'English', code: 'en'}
    ];

    const handleLogin = () => {
        try {
            if (login.trim() || password.trim()) {
                const loginData = {
                    username: login,
                    password: password
                }
                axios.post(`${apiKey}/users/auth/login/`, loginData).then((res) => {
                    console.log(res)
                    if (res?.data?.success) {
                        toast({
                            title: "Муваффақиятли!",
                            description: res?.data?.message,
                        });
                        localStorage.setItem('access', res.data.access);
                        localStorage.setItem('refresh', res.data.refresh);
                        onLogin();
                    } else {
                        toast({
                            title: "Хатолик",
                            description: res?.data?.message,
                            variant: "destructive"
                        })
                        return;
                    }
                }).catch((err) => {
                    console.log(err)
                    toast({
                        title: "Хатолик",
                        description: "Логин ёки парол нотўғри",
                        variant: "destructive"
                    });
                })
            } else {
                toast({
                    title: "Хатолик",
                    description: "Логин ёки парол нотўғри",
                    variant: "destructive"
                })
            }
        } catch (e) {
            console.log(e);
            toast({
                title: "Хатолик",
                description: "Логин ва паролни киритинг",
                variant: "destructive"
            });
            return;
        }

        // Demo accounts
        // if ((login === 'admin' && password === 'admin') ||
        //     (login === 'demo' && password === 'demo') ||
        //     (login === 'test' && password === 'test')) {
        //     toast({
        //         title: "Муваффақиятли!",
        //         description: "Тизимга кирдингиз",
        //     });
        //     onLogin();
        // } else {
        //     toast({
        //         title: "Хатолик",
        //         description: "Логин ёки парол нотўғри",
        //         variant: "destructive"
        //     });
        // }
    };

    const selectLanguage = (language: string) => {
        onLanguageChange(language);
        setShowLanguageSelector(false);
    };

    return (
        <div className="min-h-screen gradient-bg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-6">
                <div className="flex items-center space-x-2 text-blue-500">
                    <Globe size={20}/>
                    <span className="text-sm">{selectedLanguage}</span>
                </div>
                <button
                    onClick={() => setShowLanguageSelector(true)}
                    className="text-blue-500 text-sm font-medium"
                >
                    Изменить
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Авторизация</h1>
                    <p className="text-gray-600">Введите свои Логин и Пароль</p>
                    {/* <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">Demo Akkountlar:</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>admin / admin</p>
            </div>
          </div> */}
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <Input
                            type="text"
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="w-full h-14 px-4 bg-white/50 border-0 rounded-xl text-lg placeholder:text-gray-400 focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 px-4 pr-12 bg-white/50 border-0 rounded-xl text-lg placeholder:text-gray-400 focus:bg-white transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                    </div>
                </div>

                <Button
                    onClick={handleLogin}
                    className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium rounded-xl transition-colors"
                >
                    Войти
                </Button>
            </div>
            <div
                className="fixed bottom-2 left-0 right-0 flex flex-col items-center pointer-events-none select-none z-40">
                <div
                    className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500  dark:bg-gray-900/80 px-3 py-1 rounded-full shadow-sm">
                    <img src="../../itbrain-logo.png" alt="IT Brain" className="h-4 w-4"/>
                    <span>powered by IT Brain</span>
                </div>
            </div>
        </div>

    );
};

export default LoginScreen;
