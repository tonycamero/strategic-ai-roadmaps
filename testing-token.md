TOKEN: 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MjU5NDAzMSwiZXhwIjoxNzczMTk4ODMxfQ.RAtZcGrNT0B-mvoDJWOQ-4plq3NwTE4WjQDPltmCWTw

TENANT: 
8b4dc94a-9028-4bd5-8f2f-04e3440dae35

DATABASE_URL: 
'postgresql://neondb_owner:npg_5zJucGskB4QI@ep-lively-paper-a4yb6gco-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

=====================================





curl -X POST \
http://localhost:3001/api/superadmin/firms/8b4dc94a-9028-4bd5-8f2f-04e3440dae35
/sas/generate-proposals \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MjU5NDAzMSwiZXhwIjoxNzczMTk4ODMxfQ.RAtZcGrNT0B-mvoDJWOQ-4plq3NwTE4WjQDPltmCWTw" \
-H "Content-Type: application/json"



export SAS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MjU5NDAzMSwiZXhwIjoxNzczMTk4ODMxfQ.RAtZcGrNT0B-mvoDJWOQ-4plq3NwTE4WjQDPltmCWTw"
export SAS_TENANT="8b4dc94a-9028-4bd5-8f2f-04e3440dae35"




curl -X GET "http://localhost:3001/api/superadmin/firms/8b4dc94a-9028-4bd5-8f2f-04e3440dae35/sas/proposals" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MjU5NDAzMSwiZXhwIjoxNzczMTk4ODMxfQ.RAtZcGrNT0B-mvoDJWOQ-4plq3NwTE4WjQDPltmCWTw" \
  -H "Content-Type: application/json"
  
  
  
  

curl -X POST \
  http://localhost:3000/api/superadmin/firms/8b4dc94a-9028-4bd5-8f2f-04e3440dae35/stage6/compile-envelope \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MTk4NTAzMiwiZXhwIjoxNzcyNTg5ODMyfQ.hshPTVxu0Q230WmJXet5CgLnM_D5zh4X6dk9GhoaXiY"



curl -i -X POST \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"sessionId":"e89d1f62-5c87-4648-8bef-5a8de8fe9f36","message":"soft gate test"}' \
http://localhost:3001/api/superadmin/firms/$TENANT_ID/assisted-synthesis/agent/messages














TENANT_ID="8b4dc94a-9028-4bd5-8f2f-04e3440dae35"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDRkYzVhOC1mZTUxLTQ0ZjQtOTVjYS05YjgyYjQ3YmEzYjkiLCJlbWFpbCI6InRvbnlAc2NlbmQuY2FzaCIsInJvbGUiOiJzdXBlcmFkbWluIiwiaXNJbnRlcm5hbCI6dHJ1ZSwidGVuYW50SWQiOm51bGwsImlhdCI6MTc3MTk4NTAzMiwiZXhwIjoxNzcyNTg5ODMyfQ.hshPTVxu0Q230WmJXet5CgLnM_D5zh4X6dk9GhoaXiY"
BASE="http://localhost:3001/api/superadmin"


tonycamero@CameroDell:~/code/Strategic_AI_Roadmaps$ git stash list
stash@{0}: WIP on staging: c20839d Patch/roi hardening phase1 (#48)
stash@{1}: On fix/exec-brief-gate-closed: WIP split: FE auth redirect + execBrief gate + blueprints
stash@{2}: On recover/orchestrator-stash0: WIP(runtime): quarantine controller/service edits before integration
stash@{3}: On backup/ag-drift-20260221-093037: TEMP-before-authority-spine-ticket-review
stash@{4}: On staging: AG drift snapshot before clean rebuild (AUTH-EXEC-006A recovery)
stash@{5}: On staging: AG drift snapshot before clean rebuild (AUTH-EXEC-006A recovery)
stash@{6}: On main: WIP snapshot
stash@{7}: On main: WIP: mixed evolution + auth email normalization (parked for hotfix split)
stash@{8}: On (no branch): WIP: control-plane firm detail + backend fixes (pre-rebase)
stash@{9}: On master: WIP: routing refactor - preserving before v1.0.0 restore
stash@{10}: On feature/wip-recover: WIP snapshot before restoring from v1.0.0-production-stable (3e6c39b) 2026-01-23
stash@{11}: On feature/roadmap-assembly-v1: stashing unrelated changes before stage 6 lock
stash@{12}: On feature/roadmap-assembly-v1: WIP: operator execution + discovery work
stash@{13}: On recover/execution-surface-ui: WIP: stash non-recovery changes (backend + misc) to isolate execution-surface recovery
tonycamero@CameroDell:~/code/Strategic_AI_Roadmaps$