import { useEffect,useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { LockKeyhole,Eye,EyeOff } from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import { ErrorMessage,Field } from '../../components/UI';

export default function Login() {
  const {settings}=useStore(),navigate=useNavigate(),location=useLocation();
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{api('/auth/me').then(()=>navigate('/admin',{replace:true})).catch(()=>{});},[]);
  async function login(e){e.preventDefault();setBusy(true);setError('');try{await api('/auth/login',{method:'POST',body:{email,password}});const next=location.state?.from; navigate(next?.startsWith('/admin')?next:'/admin',{replace:true});}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="admin-login"><div className="login-brand-panel"><Link className="wordmark" to="/">{settings.shopName}.</Link><div><span className="eyebrow">BEHIND THE COLLECTION</span><h1>Your shop.<br/>In good<br/>hands.</h1><p>Products, orders and the everyday details.<br/>One clear place to run your business.</p></div><span>SHOP WORKSPACE / KENYA</span></div><div className="login-form-panel"><form onSubmit={login}><span className="login-lock"><LockKeyhole size={23}/></span><span className="eyebrow">SHOP ADMINISTRATION</span><h2>Welcome back.</h2><p>Sign in to manage your collection.</p><ErrorMessage>{error}</ErrorMessage><Field label="Admin email"><input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Password"><div className="password-input"><input required type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} maxLength={200}/><button type="button" className="icon-button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></Field><button className="button full-width" disabled={busy}>{busy?'Signing in…':'Sign in'}</button><Link className="text-link" to="/">Back to the storefront</Link></form></div></div>;
}
