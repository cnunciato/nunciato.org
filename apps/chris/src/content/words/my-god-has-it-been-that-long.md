---
title: Whoa! Has it really been that long?
date: 2024-09-02
draft: true
photo:
    preview:
---

Two years ago now -- two _years!_ -- I [wrote a post](/words/its-way-too-quiet-in-here) about how I was totally going to start writing more blog posts. I was feeling pretty good about it, too. I'd just started a new, more content-focused role at work (so I was gearing up to do a bunch more writing in general), I was ready to pick things back up with [my book](https://leanpub.com/pulumi), I'd just put together the beginnings of a [companion site](https://pulumibook.info/) for it, and had rewritten this site in Hugo, having spent a year or two wrestling with Next.js and finally deciding it was too big a pain to deal with anymore. I was excited and ready to get going.

And then I promptly dove into work and family life. And now, two years later, well, here we are.

I won't say I haven't written _anything_, though. I did write a few pretty decent posts for that companion site, for one. And I've written reams of [docs](https://pulumi.com/docs) and [blog posts](https://pulumi.com/blog/author/christian-nunciato) at work, along with hundreds of journal entries packed with insanely high-quality, caffeine-fueled insights -- like this one, for example:

> Man. My brain feels like absolute mush these days. I need a break.

But of course, I haven't written anything _here_.

Indeed, several of you have written to tell me just how upset and disappointed you are about this. And by several, of course, I mean none -- no one has. But it's cool -- I know you wanted to, but you probably held back, out of respect; you figured I'd get to it when I could. Which I've appreciated. Or I suppose it's also possible (however unlikely -- I mean let's be honest) that you were off living your _own_ interesting life, completely uninterested in what was happening with mine. Either way, the fact remains: I haven't used this space as well as I could have. And it's time we did something about that.

Here are a few updates.

## I've rewritten this site with Astro

For the last week or so, I've been kicking the tires with [Astro](https://astro.build/) and liking it. It's yet another framework based on React, which I generally detest (it's [not the real web](https://medium.com/building-productive/react-ruined-web-development-dd65342a833f)), so the moment I learned Astro was React-based (having just come from Next.js -- a _terrible_ experience; if you're considering Next, stay away), it had a tough hill to climb with me. But the Astro team has managed to put something together around React that succeeds at using it well while keeping much of the pain of it hidden from view. (I'm actually using Preact, which helps.) The static builds

## I've pulled everything into a monorepo

This was my first experience with a monorepo, having spent most of my dev years working in more of a microservices-based works, and I have to say, it's pretty delightful. I'm using Turborepo for this one, and it's nice, because everything here is JavaScript-based, so it all pretty much just works. And I've paid more attention to my dev workflows, linting and formatting, and so on, than I have before with personal projects, and I'm happy with the outcome. (It's still light on tests, but seriously -- this is a personal site. Who needs tests when you're pushing straight to `main`?)

## I've moved from GitHub Actions to Buildkite

I've consolidated my projects into a single monorepo that includes both my site and my son's site. This has streamlined the development process and made it easier to manage shared dependencies and configurations. With this change, I've also transitioned from using GitHub Actions to Buildkite for continuous integration. Buildkite's flexibility and powerful pipeline features have allowed me to set up more efficient and reliable CI workflows, ensuring that all parts of the monorepo are tested and deployed seamlessly.

## I also joined the team at Buildkite

This is perhaps the _biggest_ news. After six great years at Pulumi, it was time for me to move on. Things were fine, but I wanted to be able to focus more specifically on technical content marketing (that's business-speak for _writing good stuff for engineers_) than I'd been able to manage at Pulumi, and Buildkite has an amazing product that far too few people know about.

## I'm still working on the book!

made some significant progress. The book is evolving nicely, and I've added several new chapters that dive deeper into advanced Pulumi concepts and use cases. The feedback from early readers has been incredibly valuable, and I'm continuously refining the content to ensure it provides the best possible learning experience. If you haven't checked it out yet, you can find it [here](https://leanpub.com/pulumi). Stay tuned for more updates!
