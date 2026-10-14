import {createZip,readZip} from './zip.js';
const json=value=>JSON.stringify(value,null,2), decoder=new TextDecoder();
export async function makePackage(records,draft,mode='backup'){
  const files=[],pack=(record,isDraft=false)=>{const {attachments=[],...fields}=record;return {...fields,created_at:record.createdAt,updated_at:record.updatedAt,follow_up:record.followUp,sync_status:'included',attachments:attachments.map(a=>{const path=`${isDraft?'draft/':''}${a.mime.startsWith('image/')?'photos':'audio'}/${record.id}/${a.id}.${a.mime.startsWith('image/')?(a.mime.includes('png')?'png':a.mime.includes('heic')?'heic':a.mime.includes('webp')?'webp':'jpg'):a.mime.includes('mp4')?'m4a':a.mime.includes('mpeg')?'mp3':a.mime.includes('wav')?'wav':'webm'}`;files.push([path,a.blob]);return {id:a.id,name:a.name,mime:a.mime,size:a.blob.size,path};})};};
  const payload={schemaVersion:1,app:'Money20/20 Capture',project:'Infra On-Chain',mode,exportedAt:new Date().toISOString(),records:records.map(r=>pack(r)),draft:draft?pack(draft,true):null};
  files.push(['capture.json',json(payload)]);
  files.push(['manifest.json',json({schema_version:1,app:payload.app,project:payload.project,exported_at:payload.exportedAt,mode,record_count:records.length,has_draft:!!draft,attachments:[...payload.records,payload.draft].filter(Boolean).flatMap(r=>r.attachments)})]);
  files.push(['records.json',json(payload.records)]);
  files.push(['records.csv',csv([['id','created_at','updated_at','type','title','company','person','notes','dimensions','tags','priority','sync_status'],...payload.records.map(r=>[r.id,r.createdAt,r.updatedAt,r.type,r.title,r.company,r.person,r.notes,(r.dimensions||[]).join(';'),r.tags.join(';'),r.priority,'included'])])]);
  files.push(['followups.csv',csv([['record_id','action','owner','due','priority','status'],...records.filter(r=>r.nextSteps).map(r=>[r.id,r.nextSteps,r.followUp?.owner||'',r.followUp?.due||'',r.priority,r.followUp?.status||'Pendente'])])]);
  if(mode==='export'){
    files.push(['Infra-On-Chain.md',toMarkdown(payload.records)]);
    files.push(['LEIA-ME.txt','No projeto Infra On-Chain do ChatGPT, envie Infra-On-Chain.md e capture.json. Extraia este ZIP em Arquivos e envie os anexos relevantes separadamente. Áudios não foram transcritos. Preserve a distinção entre anotações, fatos verificados e hipóteses. O Capture não envia dados automaticamente ao ChatGPT.']);
  }else files.push(['LEIA-ME.txt','Backup Money20/20 Capture v1. Restaure em Backup & exportação usando este ZIP original. Inclui registros, anexos e rascunho. Não recomprima o arquivo.']);
  return createZip(files);
}
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function toMarkdown(records){return '# Money20/20 → Infra On-Chain\n\nImportação de anotações de campo. Áudios sem transcrição automática.\n\n'+records.map(r=>`## ${(r.title||'Sem título').replace(/[\r\n]/g,' ')}\n\n- ID: ${r.id}\n- Tipo: ${r.type}\n- Empresa: ${r.company||'—'}\n- Pessoa / contato: ${r.person||'—'}\n- Prioridade: ${r.priority}\n- Dimensões: ${(r.dimensions||[]).join(', ')}\n- Tags: ${r.tags.join(', ')}\n- Criado em: ${r.createdAt}\n- Atualizado em: ${r.updatedAt}\n\n### Notas\n${r.notes||'—'}\n\n### Próximos passos\n${r.nextSteps||'—'}\nResponsável: ${r.followUp?.owner||'—'} · Prazo: ${r.followUp?.due||'—'} · Status: ${r.followUp?.status||'Pendente'}\n\n### Anexos\n${r.attachments.map(a=>`- ${a.name}: ${a.path}`).join('\n')||'—'}\n`).join('\n---\n\n');}
export async function parsePackage(blob){
  const files=await readZip(blob);if(!files.has('capture.json'))throw Error('capture.json não encontrado.');
  const payload=JSON.parse(decoder.decode(files.get('capture.json')));
  if(payload.schemaVersion!==1||payload.app!=='Money20/20 Capture'||!Array.isArray(payload.records)||payload.records.length>10000)throw Error('Versão ou estrutura do backup inválida.');
  const ids=new Set(),mediaPaths=new Set();
  const unpack=(r,isDraft=false)=>{
    if(!r || typeof r!=='object'||!/^[-\w]{1,100}$/.test(r.id)||ids.has(r.id))throw Error('ID de registro inválido ou duplicado.');ids.add(r.id);
    for(const field of ['title','type','company','person','notes','priority','nextSteps','createdAt','updatedAt'])if(typeof r[field]!=='string')throw Error(`Campo ${field} inválido.`);
    if(!Number.isFinite(Date.parse(r.createdAt))||!Number.isFinite(Date.parse(r.updatedAt))||!Array.isArray(r.tags)||r.tags.some(t=>typeof t!=='string')||!Array.isArray(r.attachments))throw Error('Metadados inválidos.');
    const attachmentIds=new Set();const attachments=r.attachments.map(a=>{
      const prefix=`${isDraft?'draft/':''}${a?.mime?.startsWith('image/')?'photos':'audio'}/${r.id}/`;
      if(!a||typeof a.name!=='string'||typeof a.mime!=='string'||! /^(image|audio)\//.test(a.mime)||!/^[-\w]{1,100}$/.test(a.id)||attachmentIds.has(a.id)||!a.path?.startsWith(prefix)||mediaPaths.has(a.path)||!files.has(a.path))throw Error('Anexo inválido ou ausente.');
      attachmentIds.add(a.id);mediaPaths.add(a.path);const data=files.get(a.path);if(data.length!==a.size)throw Error('Tamanho do anexo inválido.');return {id:a.id,name:a.name,mime:a.mime,blob:new Blob([data],{type:a.mime})};
    });
    if(!Array.isArray(r.dimensions)||r.dimensions.some(d=>!['Negócios','Eficiência','Estratégia'].includes(d))||!r.followUp||['owner','due','status'].some(f=>typeof r.followUp[f]!=='string')||!['Pendente','Em andamento','Concluído'].includes(r.followUp.status))throw Error('Dimensões ou follow-up inválidos.');
    return {id:r.id,title:r.title,type:r.type,company:r.company,person:r.person,notes:r.notes,priority:r.priority,nextSteps:r.nextSteps,createdAt:r.createdAt,updatedAt:r.updatedAt,tags:r.tags,dimensions:r.dimensions,followUp:r.followUp,attachments};
  };
  const records=payload.records.map(r=>unpack(r));
  // An edited draft can intentionally share the saved record ID.
  if(payload.draft)ids.delete(payload.draft.id);
  return {records,draft:payload.draft?unpack(payload.draft,true):null};
}
