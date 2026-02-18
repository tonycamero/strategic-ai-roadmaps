import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

export default function ImpersonationCallback() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userStr = params.get('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                // Perform login
                login(token, user);
                // Redirect to dashboard
                setLocation('/dashboard');
            } catch (e) {
                console.error('Failed to parse impersonation user', e);
                setLocation('/login');
            }
        } else {
            setLocation('/login');
        }
    }, [login, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div>Initializing Impersonation Session...</div>
            </div>
        </div>
    );
}
