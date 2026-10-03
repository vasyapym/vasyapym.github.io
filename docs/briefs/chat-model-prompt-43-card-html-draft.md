# Round — render the primary profile as a senior-developer minimal html card at / (minimize-iteration3 relay Q2)

## Active variant

Q2 final — question-form refinement with a plain working draft as the whole
payload (ugly, functional, comment-free). The first attempt wrapped the
identical ask in comment-header briefs and failed to route; the owner verdict:
the router detects commentaries. Retry with the runnable draft worked first try.

## Paste this

````markdown
what will be the finished better version of the draft controller below for the profile data inside it?

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { ProfileService } from './profile/profile.service';

@Controller()
export class AppController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async card(): Promise<string> {
    const p = await this.profileService.getProfile();
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const links = p.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' · ');
    const skills = p.skills.map((s) => esc(s.name)).join(', ');
    const jobs = p.experience
      .map(
        (e) =>
          `${esc(e.company)} — ${esc(e.position)}, ${e.isCurrent ? 'present' : e.endDate?.toISOString().slice(0, 10)}`,
      )
      .join('; ');
    const projects = p.projects.map((pr) => `<a href="${esc(pr.url)}">${esc(pr.name)}</a>`).join(', ');
    return `<h1>${esc(p.name)}</h1><p>${esc(p.title)}</p><p>${esc(p.description)}</p><p>${esc(p.location ?? '')} · <a href="mailto:${esc(p.email ?? '')}">${esc(p.email ?? '')}</a></p><p>${links}</p><p>${skills}</p><p>${jobs}</p><p>${projects}</p>`;
  }
}
```
````
