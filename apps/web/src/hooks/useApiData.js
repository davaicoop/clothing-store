import { useEffect,useState,useCallback } from 'react';
import { api } from '../lib/api';

export default function useApiData(path) {
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(async()=>{
    try {const result=await api(path);setData(result);setError('');return result;}
    catch(e){setError(e.message);}finally{setLoading(false);}
  },[path]);
  useEffect(()=>{let active=true;setLoading(true);setData(null);setError('');
    api(path).then(value=>{if(active)setData(value);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[path]);
  return {data,loading,error,reload:load,setData};
}
