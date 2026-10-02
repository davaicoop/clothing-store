import { Phone,MapPin,MessageCircle,Mail,Truck,Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { whatsappLink } from '../../lib/api';

export default function Contact() {
  const {settings,money}=useStore(),whatsapp=whatsappLink(settings.whatsapp,`Hello ${settings.shopName}, I have a question.`);
  return <div className="page-container contact-page"><span className="eyebrow">HERE TO HELP</span><h1>A little help<br/>with your next favourite.</h1><div className="contact-grid"><section><h2>Get in touch</h2>{settings.phone&&<a href={`tel:+${settings.phone}`}><Phone size={21}/> +{settings.phone}</a>}{settings.email&&<a href={`mailto:${settings.email}`}><Mail size={21}/> {settings.email}</a>}{whatsapp&&<a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={21}/> Chat on WhatsApp</a>}<p><MapPin size={21}/> {settings.location}</p>{!settings.phone&&!settings.email&&!settings.whatsapp&&<p>Contact details will be available here when the shop completes its setup.</p>}</section><section><h2>Delivery & pickup</h2><h3><Truck size={20}/> Delivery · {money(settings.deliveryFee)}</h3><p>Enter your town and address at checkout. The shop will contact you to confirm delivery arrangements and timing.</p><h3><Store size={20}/> Shop pickup · Free</h3><p>Collect at {settings.location}. Wait for the shop to confirm your order is ready.</p><Link className="text-link" to="/orders">Track your order</Link></section><section><h2>Pay your way</h2><p>M-Pesa payments are manually verified by the shop. Your order stays pending until confirmation.</p><p>Cash on delivery and pay on pickup are available for their respective fulfilment options.</p></section></div></div>;
}
