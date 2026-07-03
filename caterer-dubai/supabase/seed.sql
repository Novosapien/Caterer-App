-- Caterer Dubai prototype — seed data. Run after 0001_schema.sql.
-- Fixed UUIDs for demo personas so 1-tap login + the hero scenario are deterministic.
-- HERO CHEF   : 11111111-1111-1111-1111-111111111111  (available, open_to_urgent, Palm Jumeirah)
-- DEMO RECRUITER: 22222222-2222-2222-2222-222222222222 (owns Atlantis Events)

-- Clean (idempotent-ish for re-seeding a demo DB)
truncate whatsapp_messages, whatsapp_threads, notifications, applications, jobs,
         purchases, packages, candidate_profiles, businesses, profiles restart identity cascade;

-- ---------------- Packages ----------------
insert into packages (id, name, price_aed, job_credits, cv_view_credits, features) values
 ('cccccccc-0000-0000-0000-000000000001','Starter',    499,  3,  10,  '{"3 job posts","10 CV views","Email support"}'),
 ('cccccccc-0000-0000-0000-000000000002','Caterer Pro',1499, 15, 100, '{"15 job posts","100 CV views","Urgent boosts","Priority support"}'),
 ('cccccccc-0000-0000-0000-000000000003','Enterprise', 3999, 999, 999, '{"Unlimited posts","Unlimited CV views","Urgent boosts","Dedicated manager"}');

-- ---------------- Businesses + recruiter ----------------
insert into profiles (id, role, name, email) values
 ('22222222-2222-2222-2222-222222222222','recruiter','Sofia Haddad','sofia@atlantisevents.ae');

insert into businesses (id, name, type, owner_profile_id) values
 ('aaaaaaaa-0000-0000-0000-000000000001','Atlantis Events','eventing','22222222-2222-2222-2222-222222222222'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Burj Al Arab','hotel',null),
 ('aaaaaaaa-0000-0000-0000-000000000003','Address Downtown','hotel',null),
 ('aaaaaaaa-0000-0000-0000-000000000004','DIFC Fine Dining Group','eventing',null),
 ('aaaaaaaa-0000-0000-0000-000000000005','Palm Catering Co','recruiter',null);

-- Demo recruiter starts with a Caterer Pro package (posting unlocked)
insert into purchases (business_id, package_id) values
 ('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002');

-- ---------------- Candidates ----------------
-- Hero chef first (fixed id), then 14 more.
insert into profiles (id, role, name, phone) values
 ('11111111-1111-1111-1111-111111111111','candidate','Yusuf Rahman','+971500000001'),
 ('c0000000-0000-0000-0000-000000000002','candidate','Amara Okafor','+971500000002'),
 ('c0000000-0000-0000-0000-000000000003','candidate','Liam Walsh','+971500000003'),
 ('c0000000-0000-0000-0000-000000000004','candidate','Priya Nair','+971500000004'),
 ('c0000000-0000-0000-0000-000000000005','candidate','Marco Rossi','+971500000005'),
 ('c0000000-0000-0000-0000-000000000006','candidate','Fatima Al Zahra','+971500000006'),
 ('c0000000-0000-0000-0000-000000000007','candidate','Chen Wei','+971500000007'),
 ('c0000000-0000-0000-0000-000000000008','candidate','Sofia Mendes','+971500000008'),
 ('c0000000-0000-0000-0000-000000000009','candidate','Omar Farouk','+971500000009'),
 ('c0000000-0000-0000-0000-000000000010','candidate','Grace Kim','+971500000010'),
 ('c0000000-0000-0000-0000-000000000011','candidate','Diego Santos','+971500000011'),
 ('c0000000-0000-0000-0000-000000000012','candidate','Aisha Bello','+971500000012'),
 ('c0000000-0000-0000-0000-000000000013','candidate','Tom Fletcher','+971500000013'),
 ('c0000000-0000-0000-0000-000000000014','candidate','Nadia Petrova','+971500000014'),
 ('c0000000-0000-0000-0000-000000000015','candidate','Kwame Mensah','+971500000015');

insert into candidate_profiles
 (profile_id, headline, specialisms, cuisines, interests, open_to_urgent, available, location_area, radius_km, right_to_work, certifications) values
 ('11111111-1111-1111-1111-111111111111','Chef de Partie · 8 yrs fine dining','{"Chef de Partie","Pastry"}','{"French","Mediterranean"}','{"urgent temp","pastry"}',true,true,'Palm Jumeirah',25,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000002','Head Waiter · events specialist','{"Waiter","Head Waiter"}','{}','{"urgent temp","events"}',true,true,'Downtown Dubai',20,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000003','Sous Chef · hotel banquets','{"Sous Chef"}','{"European"}','{"banquets"}',false,true,'Deira',30,true,'{"Food Hygiene L3"}'),
 ('c0000000-0000-0000-0000-000000000004','Pastry Chef · patisserie','{"Pastry"}','{"French"}','{"urgent temp","pastry"}',true,true,'Palm Jumeirah',15,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000005','Pizzaiolo · Italian','{"Chef de Partie"}','{"Italian"}','{"urgent temp"}',true,true,'JBR',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000006','Barista & floor · cafes','{"Barista","Waiter"}','{}','{"urgent temp"}',true,true,'Business Bay',15,true,'{}'),
 ('c0000000-0000-0000-0000-000000000007','Wok chef · Asian cuisine','{"Chef de Partie"}','{"Chinese","Thai"}','{}',false,true,'Deira',25,true,'{}'),
 ('c0000000-0000-0000-0000-000000000008','Event server · banqueting','{"Waiter"}','{}','{"urgent temp","events"}',true,false,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000009','Commis chef · learning fast','{"Commis Chef"}','{"Mediterranean"}','{"urgent temp"}',true,true,'Al Barsha',30,true,'{}'),
 ('c0000000-0000-0000-0000-000000000010','Bartender & mixologist','{"Bartender"}','{}','{"events"}',false,true,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000011','Grill chef · steakhouse','{"Chef de Partie","Grill"}','{"American"}','{"urgent temp"}',true,true,'JBR',25,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000012','Banquet supervisor','{"Supervisor","Waiter"}','{}','{"events"}',false,true,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000013','Kitchen porter · reliable','{"Kitchen Porter"}','{}','{"urgent temp"}',true,true,'Deira',30,true,'{}'),
 ('c0000000-0000-0000-0000-000000000014','Cold kitchen / garde manger','{"Chef de Partie","Garde Manger"}','{"French"}','{"urgent temp"}',true,true,'Palm Jumeirah',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000015','Head chef · high volume','{"Head Chef","Sous Chef"}','{"African","Mediterranean"}','{"banquets"}',false,true,'Business Bay',30,true,'{"Food Hygiene L3"}');

-- ---------------- Jobs (~18) ----------------
-- start_at uses now() offsets so "tonight/tomorrow" render naturally in the demo.
insert into jobs (business_id, title, role_type, description, venue, location_area, pay_aed, pay_unit, start_at, dress_code, is_urgent, is_temp, status) values
 ('aaaaaaaa-0000-0000-0000-000000000002','Chef de Partie','Chef de Partie','Fine-dining service at an iconic Dubai hotel. Strong section experience required.','Burj Al Arab','Umm Suqeim',340,'shift',now()+interval '5 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Pastry Chef','Pastry','Afternoon tea + plated desserts. Patisserie background preferred.','Burj Al Arab','Umm Suqeim',360,'shift',now()+interval '1 day 3 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Banquet Waiter','Waiter','Large gala dinner, 300 covers. Silver service a plus.','Address Downtown','Downtown Dubai',180,'shift',now()+interval '6 hours','Black tie',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Sous Chef','Sous Chef','Support the exec chef across banqueting operations.','Address Downtown','Downtown Dubai',520,'day',now()+interval '2 days','Chef whites',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Event Server','Waiter','Rooftop cocktail reception, 150 guests. Trays + canapes.','Atlantis The Palm','Palm Jumeirah',200,'shift',now()+interval '7 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Grill Chef','Grill','Beach BBQ event. High-volume grilling.','Atlantis The Palm','Palm Jumeirah',300,'shift',now()+interval '1 day 5 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Commis Chef','Commis Chef','Prep + service support for a private DIFC dinner.','DIFC Fine Dining','DIFC',160,'shift',now()+interval '8 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Head Waiter','Head Waiter','Lead a section at a high-profile corporate dinner.','DIFC Fine Dining','DIFC',260,'shift',now()+interval '2 days 2 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bartender','Bartender','Cocktail bar for a brand launch party.','Palm Catering event','JBR',240,'shift',now()+interval '1 day','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Kitchen Porter','Kitchen Porter','Wash-up + prep support for a busy service.','Palm Catering event','JBR',120,'shift',now()+interval '9 hours','Kitchen kit',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Barista','Barista','Specialty coffee for a morning conference.','Burj Al Arab','Umm Suqeim',150,'shift',now()+interval '1 day 12 hours','Cafe uniform',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Wok Chef','Chef de Partie','Live Asian station for a buffet dinner.','Address Downtown','Downtown Dubai',280,'shift',now()+interval '1 day 4 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Pastry Commis','Pastry','Dessert plating for a wedding, 200 covers.','Atlantis The Palm','Palm Jumeirah',190,'shift',now()+interval '10 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Banquet Supervisor','Supervisor','Oversee floor team at a corporate gala.','DIFC Fine Dining','DIFC',320,'shift',now()+interval '3 days','Black tie',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Garde Manger','Chef de Partie','Cold kitchen for a garden party.','Palm Catering event','Palm Jumeirah',270,'shift',now()+interval '1 day 6 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Head Chef (relief)','Head Chef','Cover a busy weekend brunch service.','Burj Al Arab','Umm Suqeim',700,'day',now()+interval '4 days','Chef whites',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Cocktail Server','Waiter','Evening lounge service.','Address Downtown','Downtown Dubai',170,'shift',now()+interval '2 days 5 hours','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Demi Chef de Partie','Chef de Partie','Support the hot section for a beach club event.','Atlantis The Palm','Palm Jumeirah',230,'shift',now()+interval '1 day 8 hours','Chef whites',false,true,'open');
-- Broader hospitality roles (FOH, bar/mixology, management, wider kitchen) — added 2026-07-03
insert into jobs (business_id, title, role_type, description, venue, location_area, pay_aed, pay_unit, start_at, dress_code, is_urgent, is_temp, status) values
 ('aaaaaaaa-0000-0000-0000-000000000003','Restaurant Host','Host','Greet, seat and manage guest flow at a waterfront fine-dining venue.','Bluewaters Island','Bluewaters',190,'shift',now()+interval '6 hours','Smart black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Food Runner','Runner','Expedite dishes from pass to floor during a high-volume brunch.','Atlantis The Palm','Palm Jumeirah',150,'shift',now()+interval '9 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Maitre d''','Maitre d''','Lead front of house for a high-profile private dinner in DIFC.','DIFC Fine Dining','DIFC',380,'shift',now()+interval '30 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Waiter / Waitress (fine dining)','Waiter','Silver-service a la carte at a Michelin-style restaurant.','Address Downtown','Downtown Dubai',210,'shift',now()+interval '26 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Mixologist','Mixologist','Craft signature cocktails at a rooftop brand-launch party.','Atlantis The Palm','Palm Jumeirah',300,'shift',now()+interval '7 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Head Bartender','Bartender','Run the bar team across a busy beach-club weekend.','Nikki Beach','JBR',320,'shift',now()+interval '28 hours','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bar Back','Bar Back','Keep the bar stocked, iced and running during a festival.','Palm Catering event','JBR',130,'shift',now()+interval '10 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Sommelier','Sommelier','Wine pairing and service for a six-course degustation dinner.','DIFC Fine Dining','DIFC',420,'shift',now()+interval '50 hours','Business formal',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Restaurant Manager','Manager','Cover a 120-cover restaurant for a relief week: floor leadership and service standards.','Address Downtown','Business Bay',850,'day',now()+interval '48 hours','Business formal',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bar Manager','Manager','Own bar operations for a two-week pop-up concept.','City Walk pop-up','City Walk',780,'day',now()+interval '72 hours','Smart casual',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Events Manager','Manager','Run a 400-guest corporate gala end to end.','Madinat Jumeirah','Umm Suqeim',920,'day',now()+interval '60 hours','Business formal',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','F&B Supervisor','Supervisor','Supervise floor and bar teams for a hotel banquet.','Address Downtown','Downtown Dubai',300,'shift',now()+interval '12 hours','Black tie',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Tandoor Chef','Chef de Partie','Live tandoor station for a 300-guest Indian wedding.','Al Barsha Banqueting','Al Barsha',290,'shift',now()+interval '33 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Kitchen Steward','Steward','Wash-up, hygiene and pot-wash for a large banquet service.','Address Downtown','Downtown Dubai',120,'shift',now()+interval '8 hours','Kitchen kit',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Pizza Chef','Chef de Partie','Wood-fired pizza station at a family beach festival.','Atlantis The Palm','Palm Jumeirah',240,'shift',now()+interval '34 hours','Chef whites',false,true,'open');
