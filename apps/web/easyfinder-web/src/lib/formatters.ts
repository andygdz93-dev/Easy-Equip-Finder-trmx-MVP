export const formatListingPrice=(price:number|null|undefined):string=>{if(price==null)return"Price not listed";return price.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});};
export const formatListingHours=(hours:number|null|undefined):string|null=>{if(hours==null)return null;return hours.toLocaleString()+" hrs";};
export const toPlainText=(text:string|null|undefined):string=>{if(!text)return"";return text.replace(/<[^>]*>/g,"").trim();};
