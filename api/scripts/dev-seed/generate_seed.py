import json, uuid, sys
d = json.load(open(sys.argv[1]))
OWNER = '0192f000-0000-7000-8000-000000000001'
NS = uuid.UUID('6f1c2b8e-0000-4000-8000-746266000000')
def uid(x): return 'NULL' if x is None else f"'{uuid.uuid5(NS, x)}'"
def s(x):
    if x is None: return 'NULL'
    if isinstance(x, bool): return 'true' if x else 'false'
    if isinstance(x, (int, float)): return str(x)
    return "'" + str(x).replace("'", "''") + "'"
def e(x): return 'NULL' if x is None else s(x.upper())
def arr(xs): return "ARRAY[" + ",".join(s(v) for v in xs) + "]::text[]" if xs else "'{}'"
out = ["-- Development sample data, generated from web/src/lib/sample-data (same records the",
       "-- frontend shows). Ids are UUIDv5 of the frontend ids, so links stay consistent.",
       "-- Loaded only with the dev profile (spring.flyway.locations includes db/dev).", ""]
def ins(table, cols, rows):
    if not rows: return
    out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES")
    out.append(",\n".join("  (" + ", ".join(r) + ")" for r in rows))
    out.append("ON CONFLICT DO NOTHING;\n")
ins('identity.app_user', ['id','name','email'], [[s(OWNER), s('Thiago'), s('owner@tbfernandes.local')]])
O = s(OWNER)
ins('work.company', ['id','owner_id','name','trade_name','relationship','status','description','start_date','main_contact'],
    [[uid(c['id']),O,s(c['name']),s(c.get('tradeName')),e(c['relationship']),e(c['status']),s(c.get('description')),s(c['startDate']),s(c.get('mainContact'))] for c in d['sampleCompanies']])
ins('work.project', ['id','owner_id','company_id','name','description','category','status','color','start_date','due_date','next_delivery','goal_id'],
    [[uid(p['id']),O,uid(p.get('companyId')),s(p['name']),s(p.get('description')),e(p['category']),e(p['status']),e(p['color']),s(p['startDate']),s(p.get('dueDate')),s(p.get('nextDelivery')),uid(p.get('goalId'))] for p in d['sampleProjects']])
rows=[]; items=[]
for t in d['sampleTasks']:
    cl = t.get('checklist') or {}
    done = t['status']=='done'
    rows.append([uid(t['id']),O,uid(t.get('projectId')),s(t['title']),s(t.get('description')),e(t['status']),e(t['priority']),s(t.get('tag')),s(t.get('startDate')),s(t.get('dueDate')),s(t.get('doneCriteria')),s(cl.get('done')),s(cl.get('total')),uid(t.get('goalId')),
                 s((t.get('completedAt') or t.get('dueDate') or d['SAMPLE_TODAY'])+'T18:00:00Z') if done else 'NULL'])
    for i,it in enumerate(t.get('checklistItems') or []):
        items.append([uid(t['id']),str(i),uid(it['id']),s(it['title']),s(it['done'])])
ins('work.task', ['id','owner_id','project_id','title','description','status','priority','tag','start_date','due_date','done_criteria','checklist_done','checklist_total','goal_id','completed_at'], rows)
ins('work.task_checklist_item', ['task_id','position','id','title','done'], items)
links={}
for kind,key in (('NOTE','sampleNotes'),('SNIPPET','sampleSnippets')):
    links[kind]=[]
    for n in d[key]:
        links[kind] += [[uid(n['id']),s('PROJECT'),uid(p)] for p in n.get('projectIds',[])]
        links[kind] += [[uid(n['id']),s('TASK'),uid(t)] for t in n.get('taskIds',[])]
ins('knowledge.note', ['id','owner_id','title','body','tags','created_at','updated_at'],
    [[uid(n['id']),O,s(n['title']),s(n['body']),arr(n.get('tags')),s(n['createdAt']),s(n['updatedAt'])] for n in d['sampleNotes']])
ins('knowledge.snippet', ['id','owner_id','title','language','code','explanation','source_url','tags','created_at','updated_at'],
    [[uid(n['id']),O,s(n['title']),s(n['language']),s(n['code']),s(n.get('explanation')),s(n.get('sourceUrl')),arr(n.get('tags')),s(n['createdAt']),s(n['updatedAt'])] for n in d['sampleSnippets']])
ins('knowledge.note_link', ['note_id','target_type','target_id'], links['NOTE'])
ins('knowledge.snippet_link', ['snippet_id','target_type','target_id'], links['SNIPPET'])
ins('knowledge.method', ['id','owner_id','title','summary','category','tags','last_reviewed'],
    [[uid(m['id']),O,s(m['title']),s(m['summary']),e(m['category']),arr(m.get('tags')),s(m['lastReviewed'])] for m in d['sampleMethods']])
ins('knowledge.method_step', ['method_id','position','title','detail'],
    [[uid(m['id']),str(i),s(st['title']),s(st.get('detail'))] for m in d['sampleMethods'] for i,st in enumerate(m['steps'])])
ins('knowledge.method_example', ['method_id','position','title','content'],
    [[uid(m['id']),str(i),s(x['title']),s(x['content'])] for m in d['sampleMethods'] for i,x in enumerate(m.get('examples') or [])])
goals = sorted(d['sampleGoals'], key=lambda g: g.get('parentId') is not None)
ins('goals.goal', ['id','owner_id','parent_id','name','description','area','status','priority','current_state','desired_result','done_criteria','due_date','indicator_label','indicator_current','indicator_target','indicator_unit'],
    [[uid(g['id']),O,uid(g.get('parentId')),s(g['name']),s(g.get('description')),e(g['area']),e(g['status']),e(g['priority']),s(g.get('currentState')),s(g['desiredResult']),s(g.get('doneCriteria')),s(g.get('dueDate')),
      *( [s(g['indicator']['label']),s(g['indicator']['current']),s(g['indicator']['target']),s(g['indicator']['unit'])] if g.get('indicator') else ['NULL']*4)] for g in goals])
ins('goals.milestone', ['id','goal_id','title','due_date','done','position'],
    [[uid(m['id']),uid(m['goalId']),s(m['title']),s(m.get('dueDate')),s(m['done']),str(i)] for i,m in enumerate(d['sampleMilestones'])])
ins('learning.skill', ['id','owner_id','name','level','evidence'],
    [[uid(k['id']),O,s(k['name']),s(k['level']),s(k.get('evidence'))] for k in d['sampleSkills']])
ins('learning.study', ['id','owner_id','name','description','status','goal_id','start_date','due_date','next_activity'],
    [[uid(x['id']),O,s(x['name']),s(x.get('description')),e(x['status']),uid(x.get('goalId')),s(x.get('startDate')),s(x.get('dueDate')),s(x.get('nextActivity'))] for x in d['sampleStudies']])
ins('learning.study_skill', ['study_id','skill_id'], [[uid(x['id']),uid(k)] for x in d['sampleStudies'] for k in x.get('skillIds',[])])
ins('learning.material', ['id','owner_id','study_id','title','type','url','status','notes'],
    [[uid(x['id']),O,uid(x.get('studyId')),s(x['title']),e(x['type']),s(x.get('url')),e(x['status']),s(x.get('notes'))] for x in d['sampleMaterials']])
ins('learning.certification', ['id','owner_id','name','issuer','status','obtained_at','expires_at','validation_url'],
    [[uid(x['id']),O,s(x['name']),s(x['issuer']),e(x['status']),s(x.get('obtainedAt')),s(x.get('expiresAt')),s(x.get('validationUrl'))] for x in d['sampleCertifications']])
ins('learning.certification_study', ['certification_id','study_id'], [[uid(x['id']),uid(k)] for x in d['sampleCertifications'] for k in x.get('studyIds',[])])
ins('learning.education', ['id','owner_id','institution','course','degree','status','start_date','end_date'],
    [[uid(x['id']),O,s(x['institution']),s(x['course']),s(x['degree']),e(x['status']),s(x['startDate']),s(x.get('endDate'))] for x in d['sampleEducations']])
ins('finance.entry', ['id','owner_id','kind','scope','category','description','amount','entry_date','recurring'],
    [[uid(x['id']),O,e(x['kind']),e(x['scope']),s(x['category']),s(x['description']),s(x['amount']),s(x['date']),s(x['recurring'])] for x in d['sampleFinanceEntries']])
ins('finance.purchase_goal', ['id','owner_id','name','description','estimated','reserved','monthly_saving','priority','desired_date','goal_id','status','paid'],
    [[uid(x['id']),O,s(x['name']),s(x.get('description')),s(x['estimated']),s(x['reserved']),s(x.get('monthlySaving')),e(x['priority']),s(x.get('desiredDate')),uid(x.get('goalId')),e(x['status']),s(x.get('paid'))] for x in d['samplePurchases']])
ins('contacts.contact', ['id','owner_id','name','company_id','company_name','role','email','phone','profile_url','specialties','context','next_contact','notes'],
    [[uid(x['id']),O,s(x['name']),uid(x.get('companyId')),s(x.get('companyName')),s(x.get('role')),s(x.get('email')),s(x.get('phone')),s(x.get('profileUrl')),arr(x.get('specialties')),s(x.get('context')),s(x.get('nextContact')),s(x.get('notes'))] for x in d['sampleContacts']])
ins('contacts.interaction', ['id','contact_id','occurred_on','kind','summary','follow_up_task_id'],
    [[uid(x['id']),uid(x['contactId']),s(x['date']),e(x['kind']),s(x['summary']),uid(x.get('followUpTaskId'))] for x in d['sampleInteractions']])
open(sys.argv[2],'w').write("\n".join(out))
