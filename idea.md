I want to build an app for my wife that she can help use at her job. She is currently an executive assistant where she has to do a lot of emailing and following up on said emails. 
Her job is currently overwhelming from all the tracking that she needs to do. And wants a system that can help her track her work (when a email was recieved, when a follow up needs to happen, when it did/didn't happen, etc) and a system that can show how much work she is really doing to her bosses. 

She is currently using a OneNote setup where she will type in a task and then high light said task with things like "Done", "Needs Follow up", etc. Its still very manual. And she
has to manually copy tasks that have not been done to the next day. She also has to manually cut/paste tasks to prioritize them in terms of urgency. 

Can you help me ideate something that can work for her and then help build it? Lets discuss what all this app should do and then what tools we should use to build it. As we plan, lets put concrete ideas in a plan.md so we can keep up to date on where we are with the project/ track work.

## Workflow

She primarily works from the Desktop version of Outlook
She is following up on emails that she sent to individuals that she sent. Could be confirming a meeting date, travel accomadations, etc
She typically is tracking mid to high 10s of emails every day. She manages the calanders of 4 deans and is the executive assistante for the head dean (so 5 total) ontop of other random tasks. 

## Reporting

I think a quick dashboard that somebody could filter down by month, week, or perhaps day would be sufficient. 

## Access

She works on a company computer yes - so we would not be able to install something on her computer. A simiple login may be useful too. Lets focus on desktop first. I don't think mobile would be very useful imo.

## Integration

In an ideal world, I think an integration would be fantastic, but has some security ramifications on the business side for data exfil from the company. I think manual creation would be the way forward (unfortunately) But I think that heavily prioritizes ease of use.

## Additional thoughts

I think another great feature would be a "Today" view which shows all tasks in progress. And when tasks are not marked as done, they carry over to the next "Today" view.

This might change the implementation, but I do work at Fastly and have access to their services for "Free". Instead of vercel, maybe trying to host something on Fastly Compute would make sense? But if it doesn't that's ok. 

I also have a homelab kubernetes cluster which I can expose things through via Tailscale Funnels.
