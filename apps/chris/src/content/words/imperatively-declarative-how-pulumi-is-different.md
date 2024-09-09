---
title: Imperatively Declarative: How Pulumi Is Different
date: 2021-08-09
description: How Pulumi is different.
summary: How Pulumi is different.
photo:
    preview: /media/images/awsx.jpg
    caption: A Pulumi program defining an Amazon API Gateway REST API
---

In conversations about [infrastructure as code](https://en.wikipedia.org/wiki/Infrastructure_as_code), the debate over [imperative versus declarative](https://en.wikipedia.org/wiki/Infrastructure_as_code#Types_of_approaches) tools still comes up from time to time. Actually, there's not much left to debate: declarative's pretty much won. But somehow, the subject still manages to get people going, probably because what "declarative" means isn't quite as clear as it used to be --- and that's partly because of tools like Pulumi.

When Pulumi comes up in one of these conversations, it usually gets placed on the imperative end of the spectrum; it's an easy mistake to make, considering Pulumi programs are written in imperative languages like JavaScript. But it's a mistake nonetheless. [Here's an example of such an exchange](https://twitter.com/brianleroux/status/1415310789167046657) from a while back, for instance:

> I will be very specific using my previous example. JS is imperative. JSON is declarative.
>
> --- Brian LeRoux (@brianleroux) [July 14, 2021](https://twitter.com/brianleroux/status/1415310789167046657)

It's worth mentioning that Brian is the creator of [arc.codes](https://arc.codes/docs/en/guides/get-started/quickstart), a command-line tool that lets you write blocks of JSON or YAML to deploy serverless functions and other things on [AWS](https://aws.amazon.com/). Arc is a perfect example of simple, declarative infrastructure as code that's focused on making the [easy things easy](https://www.google.com/books/edition/Programming_Perl/xx5JBSqcQzIC?hl=en&gbpv=1&bsq=%22easy%20things%20should%20be%20easy,%20and%20hard%20things%20should%20be%20possible%22). Take a look at this terse little Arc file, for example:

```yaml
app: "hello-world"
http:
    - get: "/thing1"
    - get: "/thing2"
```

In Arc, this bit of YAML states that at the end of an Arc run, two publicly accessible HTTP endpoints should exist in [AWS Lambda](https://aws.amazon.com) (at a URL dynamically assigned by AWS) at the paths `/thing1` and `/thing2`, and that both endpoints should be wired up to respond to HTTP `GET`s. When you run this file with the Arc CLI --- assuming you've stashed your AWS credentials in the right place, and put your JavaScript functions in a nearby subfolder --- that'll indeed be the case: a minute or so later, those endpoints _will_ exist, and all will be right with the world. Easy.

Moreover, if you were to run that code a _second_ time (having made no changes to the YAML or JavaScript), nothing would happen, because the "desired state" you'd expressed in the `arc.yaml` file would already have been achieved: with those two endpoints deployed and running in the AWS cloud, Arc (by way of [CloudFormation](https://aws.amazon.com/cloudformation/)) would have nothing more to do for you. That's [declarative](https://en.wikipedia.org/wiki/Declarative_programming) infrastructure-as-code (IaC) at work: you describe _what you want_ --- two HTTP endpoints --- and the IaC tool determines the _how_, computing the work to be done and then making it happen for you.

[_Imperative_](https://en.wikipedia.org/wiki/Imperative_programming) IaC, on the other hand, is different. In imperative programming (e.g., in most JavaScript), the code that you write is all about control --- _do this, then that; if this, then that_. A good example of the difference between declarative and imperative programming would be to compare the experience of building a web page statically with hand-crafted HTML (which is about as declarative as you can get):

```html
...
<section id="things">
    <ol>
        <li>Thing 1</li>
        <li>Thing 2</li>
        <li>Thing 3</li>
    </ol>
</section>
...
```

... to building one dynamically by [scripting the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/How_to_create_a_DOM_tree):

```javascript
let ul = document.createElement("ol");

for (let i = 0; i < 3; i++>) {
    let li = document.createElement("li");
    li.textContent = `Thing ${i + 1}`;
    ul.appendChild(li)
}

document.querySelector("#things").appendChild(ul);
```

Both yield the same result --- a three-item list --- but in fundamentally different ways. In HTML, the author says what they want, up front, and lets the browser handle the rest. In JavaScript, however, the author tells the browser _how_ to create that list, algorithmically, one element at a time before attaching it programmatically to the page at some point later.

IaC tools vary similarly. Classically declarative tools like Arc, [CloudFormation](https://aws.amazon.com/cloudformation/), [Terraform](https://www.terraform.io/), and others have you type out what you want, usually in some sort of structured configuration, and handle the work of provisioning and updating for you. Imperative tools don't do nearly as much; instead, they give _you_ the APIs to tell _them_ what to do and how to do it.

As an example, imagine you wanted to create a couple of storage buckets on [Amazon S3](https://aws.amazon.com/s3/). To do that imperatively, you might reach for Amazon's [SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/) and tap out a small imperative program like this one:

```javascript
const { S3Client, CreateBucketCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");
const client = new S3Client({ region: "us-west-2" });

(async () => {
    // Name a couple of buckets.
    const desiredBuckets = ["bucket-1", "bucket-2"].map(
        bucket => `some-interestingly-named-${bucket}`,
    );

    // Imperatively create them, by calling the AWS S3 API directly.
    desiredBuckets.forEach(async bucket => {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
    });

    // Finally, list all buckets, including the two you just created.
    console.log((await client.send(new ListBucketsCommand({}))).Buckets);
})();
```

You could run this program with Node.js (again, assuming your AWS creds were stashed [in their proper locations](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)), and in a few moments, produce the following result:

```bash
$ node index.js
[
  {
    Name: 'some-interestingly-named-bucket-1',
    CreationDate: 2021-03-08T18:00:04.000Z
  },
  {
    Name: 'some-interestingly-named-bucket-2',
    CreationDate: 2021-03-08T18:00:04.000Z
  },
]
```

Nice, right? And easy enough --- assuming you're comfortable with JavaScript.

However, unlike the Arc example I shared earlier, running the program a second time would fail:

```bash
$ node index.js
UnhandledPromiseRejectionWarning: BucketAlreadyOwnedByYou
```

... which is unfortunate, but makes sense, considering the buckets would already have been created. To keep repeated runs of the program from failing --- an important consideration, say, if the program were running as a part of an automated deployment process --- you'd have to write a bit more code to check for the existence of each bucket _before_ attempting to create it:

```javascript
// ...

(async () => {
    const desiredBuckets = ["bucket-1", "bucket-2"].map(
        bucket => `some-interestingly-named-${bucket}`,
    );

    // First, fetch a list of all buckets.
    const allBuckets = await client.send(new ListBucketsCommand({}));
    const allBucketNames = allBuckets.Buckets.map(b => b.Name);

    // Create the new buckets...
    desiredBuckets

        // ...but only if they haven't been created already.
        .filter(name => !allBucketNames.includes(name))

        .forEach(async bucket => {
            await client.send(new CreateBucketCommand({ Bucket: bucket }));
        });
    // ...
})();
```

And that'd certainly work.

But at the same time, all you really need is a couple of S3 buckets, here, and already you've begun to accumulate a good bit of code --- code that has to be debugged, tested, maintained, and all the rest. If you wanted to assemble something a little more complicated --- a couple of serverless endpoints, maybe, or the virtual infrastructure to run a typical web application --- you'd be looking at writing a lot _more_ code, and this pattern of checking _whether_ to do something before actually doing it (or doing something slightly different, maybe, under certain conditions) would continue to the point that it'd be hard for someone else (or even a future version of yourself) to look at the code and understand what was really going on --- certainly much harder than looking at a few lines of declarative YAML. Sometimes, of course, imperative code is just what you need. But for [lots of reasons](https://en.wikipedia.org/wiki/Infrastructure_as_code#Added_value_and_advantages), declarative tools are usually the right way to go --- which is why, as I said, the debate's pretty much over.

Where does that leave Pulumi, though? If Pulumi programs really are written in imperative languages like JavaScript, doesn't that make Pulumi itself an imperative tool, too, by extension?

In a word, no --- but understanding _why_ the answer is no takes a bit more explanation.

## Breakfast as code

I haven't always been a big breakfast person, but these days, I am, and for me, breakfast usually means an egg, some toast, and a bit of orange juice, with an occasional bunch of leafy-green things thrown in for good measure. Represented as JSON, my usual breakfast looks something like this:

```json
{
    "breakfast": {
        "eggs": {
            "count": 1,
            "kind": "scrambled"
        },
        "toast": {
            "count": 1,
            "kind": "multi-grain"
        },
        "juice": {
            "count": 1,
            "kind": "orange"
        }
    }
}
```

It's a fairly common choice, as breakfasts go --- so common that I could probably walk into any caf&eacute;, hand someone this snippet of JSON, and wait patiently for the result to show up on the table in front of me. In a way, this is declarative breakfast-as-code: I say what I want --- egg, toast, juice --- and a bunch of skilled humans conspire to make that happen for me.

And while I certainly _know_ there's an order in which these things tend to happen --- the eggs need scrambling, so the chef may prep them first; the toast goes quicker, so that'll probably happen later, etc. --- that order isn't important to _me_ as a customer. In the end, all I care about is that when breakfast is ready, it's hot, and on my plate. The JSON document just describes my _desired_ breakfast; it doesn't tell the chef or anyone else how to make it. That's what makes it declarative.

Static text like JSON and YAML aren't the only ways to declare a desired breakfast, though. Here's a little JavaScript program that allocates a similar set of breakfast objects and relationships. Again, notice there isn't any _how_ going on, here --- we're still firmly in _what_ territory:

```javascript
import { Breakfast, Eggs, Toast, Juice } from "some-menu-or-something";

const breakfast = new Breakfast({
    eggs: new Eggs(1, "scrambled"),
    toast: new Toast(1, "multi-grain"),
    juice: new Juice(1, "orange"),
});
```

Here, `breakfast` still consists of three things --- object instances of `Eggs`, `Toast`, and `Juice` --- just as it did in the JSON representation. Assuming the constructors of these objects weren't doing anything fancy under the hood (just allocating local instance properties of their own, say), you'd expect that running this program with Node.js would produce, for a moment, a `breakfast` variable referring to an instance of the `Breakfast` class, and that the `breakfast` instance would itself contain references to instances of each of its ingredients before the program finally exited. Without a doubt, this is imperative JavaScript _code_ --- but this particular expression is totally declarative; we've simply stated that `breakfast` _depends_ on three ingredients, and left it up to the JavaScript engine to handle the dependent allocations and the order in which to perform them.

As it happens, this a lot like [how Pulumi works](https://www.pulumi.com/docs/intro/concepts/how-pulumi-works/), too. A call to a Pulumi resource constructor (like [`new aws.s3.Bucket()`, for example](https://www.pulumi.com/docs/reference/pkg/aws/s3/bucket/)) is just an object declaration like any other, an expression of your desire to have an S3 bucket exist --- not to _create_ the S3 bucket _in that moment_, but to _have_ it exist when the program completes. At runtime, the Pulumi SDK and engine conspire to gather up all of the object allocations in your program, figure out their relationships (which objects depend on which, what values they need from each other, and so on), assemble a JSON-serializable [object graph](https://en.wikipedia.org/wiki/Object_graph) representing the full picture, and then use that graph to call on the cloud provider directly to produce the appropriate result. Just like with Arc and other _statically_ declarative tools, the code you write with Pulumi still says _what_, not _how_, and Pulumi takes care of delivering the outcome for you.

Here's what it looks like to make a couple of S3 buckets with Pulumi and JavaScript, for example:

```javascript
const aws = require("@pulumi/aws");

const bucket1 = new aws.s3.Bucket("bucket1");
const bucket2 = new aws.s3.Bucket("bucket2");
```

If you wanted, since you're working with JavaScript, you could even get a bit fancier by declaring the buckets with [`Array#map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map):

```javascript
[1, 2].map(i => new aws.s3.Bucket(`bucket${i}`));
```

Run the program once, and you get two buckets (along with a "[stack](https://www.pulumi.com/docs/intro/concepts/stack/)," if you didn't already have one):

```bash
$ pulumi up

Updating (dev)

     Type                 Name         Status
 +   pulumi:pulumi:Stack  buckets-dev  created
 +   ├─ aws:s3:Bucket     bucket1      created
 +   └─ aws:s3:Bucket     bucket2      created

Resources:
    + 3 created
```

Run it again, you get nothing, because the buckets you declared already exist:

```bash
$ pulumi up

Updating (dev)

     Type                 Name
     pulumi:pulumi:Stack  buckets-dev

Resources:
    3 unchanged
```

You could even reverse the sort order and still get the same result (since ultimately, it's up to Pulumi to determine what needs to be done, and how):

```javascript
[1, 2].map(i => new aws.s3.Bucket(`bucket${i}`)).reverse();
```

```bash
$ pulumi up

Updating (dev)

     Type                 Name
     pulumi:pulumi:Stack  buckets-dev

Resources:
    3 unchanged
```

Again, that's declarative (and [idempotent!](https://en.wikipedia.org/wiki/Idempotence)) infrastructure as code --- it just happens to have been written with an imperative programming language. You could modify this program to add a third bucket, remove a bucket, declare a JavaScript function to be invoked [in response to a bucket event](https://www.pulumi.com/docs/guides/crosswalk/aws/lambda/), whatever you want, it's always the same: Pulumi launches your chosen language runtime, listens for object allocations (by way of the `@pulumi/aws` SDK, for example), registers those allocations with the [engine](https://www.pulumi.com/docs/intro/concepts/how-pulumi-works/), computes an in-memory graph of resources and relationships, and then calls on your cloud provider directly to issue the appropriate set of changes, in the right order.

Great --- so now you know how Pulumi works.

But it's still worth asking: is all of this really _necessary?_ What kinds of problems does Pulumi actually solve? What makes this "imperatively declarative" approach to infrastructure worth the additional layers of indirection --- the language, runtime, dependencies, and the rest? Wouldn't it be easier just to write a few lines of YAML and be done than to have to contend with all of this extra _stuff?_

Sure --- for simple things, maybe. But software has a funny way of starting out simple and suddenly becoming annoyingly complex --- often a lot sooner than you think.

## When breakfast gets complicated

For me, thanks to my basic breakfast needs, getting what I want is usually no big deal. That's because most caf&eacute;s are going to have eggs, bread, and orange juice on hand and ready to make --- and also because I'm not all that fussy about the details.

But for my family, it's more complicated. I have three kids, for example, all of whom have mild food sensitivities, and a wife who rarely eats out because of how hard it is to find something she likes. None of them could walk into a diner with an order like mine, because they'd need to be able to ask certain questions first: _Are the eggs made with milk? Are the waffles gluten-free?_ Each of these questions needs to be answered, for real and important reasons, before our collective order can be submitted and fulfilled.

It'd be impossible, in other words, to walk into a restaurant with a handwritten order for a family like ours expecting to have it accepted verbatim without some kind of interaction first. _Oh, the waffles aren't gluten-free? Okay --- we'll take an omelet instead._ It's always something, and I imagine it's probably like that for most of us: we know what we want, and we're usually able to get it, but not without a little negotiation during the process. At a high level, we know want "breakfast", which is easy. But in practice, we almost always end up having to apply some sort of algorithm, however simple, during that process.

In fact, that's kind of how _everything_ works, software included --- and infrastructure (especially the cloud-based kind) is nothing not fundamentally software. If all you need is a couple of storage buckets or Lambdas or VMs, sure, you can kick out that stuff with a few lines of YAML and get on with your day --- and that's awesome, to be sure. But more often, what you'll find is that you'll eventually need _something more_, some tiny bit of customization or other that the simple tool can't _quite_ give you out of the box --- and that's when the trouble begins.

When the problem is straightforward and well bounded, in other words, simple tools are great, and often more than enough to get the job done. But when the problem is even a little bit complicated, or when the problem _space_ expands beyond what those simple tools were originally designed for, the tools themselves will tend to bend and crack in the places that weren't really made with complexity in mind.

Take our two buckets, for example. If you knew how many buckets you wanted to create and how you wanted to name them, you could do that fairly easily with [HCL](https://www.terraform.io/docs/language/syntax/configuration.html), the config language of Terraform:

```hcl
provider "aws" {
  region = "us-west-2"
}
variable "buckets" {
  type = list(string)
  default = ["1", "2", "3"]
}
resource "aws_s3_bucket" "bucket" {
  count = length(var.buckets)
  bucket = "some-interestingly-named-bucket-${var.buckets[count.index]}"
}
```

If you're not familiar with HCL, you might need to squint to figure out what's going on here, but it's a lot like our first bucket-provisioning example from earlier: we just loop through a list of strings ("1", "2", and "3"), creating a bucket for each one:

```bash
$ terraform apply

aws_s3_bucket.bucket[1]: Creating...
aws_s3_bucket.bucket[2]: Creating...
aws_s3_bucket.bucket[0]: Creating...
aws_s3_bucket.bucket[0]: Creation complete after 3s [id=some-interestingly-named-bucket-1]
aws_s3_bucket.bucket[1]: Creation complete after 3s [id=some-interestingly-named-bucket-2]
aws_s3_bucket.bucket[2]: Creation complete after 3s [id=some-interestingly-named-bucket-3]
```

Again, this totally works --- assuming the names you've chosen [are globally unique](https://www.pulumi.com/docs/intro/concepts/resources/#autonaming).

Now imagine you had to name those buckets in a slightly more complicated way --- using stringified date, perhaps. Naming a bucket dynamically with a format string like `YYYY-MM-DD` is maybe _possible_ with Terraform (or if not, maybe using a bit of [shell scripting](https://en.wikipedia.org/wiki/Shell_script) with and an HCL `variable`), but you'd definitely be running into the limits of what HCL is able to do on its own. That's not a knock against HCL, either: every special-purpose language runs the risk of hitting these kinds of limitations eventually.

With general-purpose languages like JavaScript, though, this kind of thing is trivially easy, either with the language alone or with the help of a third-party package to make things even easier --- one like [Day.js](https://github.com/iamkun/dayjs), for example:

```javascript
import * as aws from "@pulumi/aws";
import * as dayjs from "dayjs";

// Keep a bucket for each of the last 7 days.
for (let i = 0; i < 7; i++) {
    new aws.s3.Bucket(dayjs().subtract(i, "day").format("YYYY-MM-DD"));
}
```

```bash
$ pulumi up

Updating (dev)

     Type                 Name         Status
 +   pulumi:pulumi:Stack  buckets-dev  created
 +   ├─ aws:s3:Bucket     2021-03-24   created
 +   ├─ aws:s3:Bucket     2021-03-29   created
 +   ├─ aws:s3:Bucket     2021-03-28   created
 +   ├─ aws:s3:Bucket     2021-03-27   created
 +   ├─ aws:s3:Bucket     2021-03-25   created
 +   ├─ aws:s3:Bucket     2021-03-23   created
 +   └─ aws:s3:Bucket     2021-03-26   created

Resources:
    + 8 created

Duration: 9s
```

When you carve away the language, Pulumi and Terraform are doing a lot of the same things: both work to assemble graphs of resources and dependencies, both use those graphs to communicate with cloud providers directly, and both manage state in conceptually similar ways. It's at the language layer --- and up --- that they really start to diverge.

Again, how much that matters is for you to decide. But as a developer, I'll take a full programming language (especially one I know well) any day of the week, because it means I can do anything the language _and its ecosystem_ can do, and that I probably won't end up in tears in six months when I'm faced with a problem that my tools can't handle. Just yesterday, for example, I found myself wrestling with [Bash](https://www.gnu.org/software/bash/) trying to move a few files between Git repositories. After a frustrating couple of hours of hacking and Googling, I realized I could just use Node.js instead --- and when I did, I was done in a matter of minutes. An expert shell programmer might've made light work of what I was trying to do --- but I'm not an expert shell programmer, and Bash isn't JavaScript. All it took was a couple of Node.js built-ins and libraries:

```
$ yarn add glob micromatch
```

... and eight lines of JavaScript later, I was done.

For me, language --- and all that comes with it --- is ultimately what it's all about.

## Like React for infrastructure

All of this reminds me of the progression we've seen over the last two decades in web development.

Think of [React](https://reactjs.org/). Why do we have it? Because HTML alone isn't enough, and imperative DOM scripting leads to reams of unmaintainable code. We got React because we, as developers, wanted to _think_ about, and compose, our front-end applications in declarative ways --- but we _needed_ to retain the flexibility of the JavaScript language. So we got React --- and with it, an imperatively declarative programming model for the web:

```javascript
// Imperative code...
const offices = ["Akron", "Nashua", "Rochester", "Scranton", "Syracuse", "Utica"];

export default function DunderMifflinBranchOffices() {
    // ... declaratively rendered...
    return (
        <ul>
            {offices.map(office => (
                <li>
                    <span>{office}</span>
                    {office === "Scranton" && <span>← The best one</span>}
                </li>
            ))}
        </ul>
    );
}
```

```html
...
<html>
    <body>
        <aside>
            <nav>
                <!-- ... and composed. -->
                <DunderMifflinBranchOffices />
            </nav>
        </aside>
        <main>...</main>
    </body>
</html>
```

It's the same thing with infrastructure: we want a declarative mental model, but we need the control and composabilty of general-purpose languages. Hence tools like Pulumi.

It'll be interesting to see where things go from here; [I'm](https://pulumibook.info/about) [certainly](https://www.pulumi.com/about/) [biased](https://thepulumibook.com/), but also a fascinated observer. The trajectory is what interests me most, though --- that, and being able to manage my own infrastructure in ways that feel comfortable to me as a developer. (Which reminds me, I should probably write about how I manage _this_ site sometime....)

    > **Hey look, there's a book!**: I'm currently writing a book about Pulumi. It's still in the works, aimed at helping developers get a foothold into the cloud, and you can grab yourself an in-progress digital copy on Leanpub. [Check it out](https://thepulumibook.com)!
