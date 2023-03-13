import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from "openai";
import { ProgramConstantsId } from "./enums/program-constants-id.enum";

export const PROMPTS_MATCHING_REG_EXP = /--positive-prompt\:? ?(?<positive>.*)[ \n]*--negative-prompt\:? ?(?<negative>.*)[ \n]*/gmi;
export const ITEMS_WITH_SETTINGS_MATCHING_REG_EXP = /- ?([\w \-\(\)]+): ?(.+?)?$/g;
export const HANDLEBAR_TEMPLATES_MATCHER = /\{(\w+?)\}/g;

export const CONVERSATION_STARTERS: Record<ProgramConstantsId, ChatCompletionRequestMessage[]> = {
  [ProgramConstantsId.IMAGES_PROMPTS]: [
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: 'Do you know about Stable Diffusion image generation AI?',
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: 'Yes, Stable Diffusion Im age Generation AI is a type of Generative Adversarial Network (GAN) used to generate realistic images based on a set of input images. It uses a “stable” version of the Wasserstein GAN (WGAN) model to improve the quality of results and reduce the risk of “mode collapse”. It is used in many applications such as image editing, object recognition, and computer vision.',
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: `There is a widely accepted pattern to use for stable diffusion prompting. It goes like this: "[image technique] of [object] [adjectives describing object] [additional description of surroundings], [optional: artists to base style off], [optional: view angle or perspective description], [image quality modifiers], [end modifications]" which is positive prompt. It's always best to accompany it with a negative prompt that that is just a comma list of things you don't want to see in the picture, but are likely to occur, listed by comma.
Here are couple of examples:
subject: "majestic phoenix" --positive-prompt an artistic digital painting masterpiece, artwork of a majestic phoenix in the center, fluid colourful smoke explosion of paint, black background, a beautiful artwork illustration, inspired by Sam Spratt and Alberto Seveso, trending on Behance artstation and cgsociety, depth of field, abstract art, 3D illustrations Rhads (aka Beeple), 3D render, prompt by TanvirTamim, 8k resolution render --negative-prompt two heads, two face, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured
subject: "landscape from the Moon" --positive-prompt a landscape from the Moon with the Earth setting on the horizon, realistic, detailed  --negative-prompt whimsical interpretation of the prompt
subject: "sticker of a cute female teacher" --positive-prompt sticker of a cute female teacher, running, digital illustration, disney, rule 63, full body, perfect anatomy, perfect face, butt showing esthetically, abstract beauty, beautiful, centered, looking at the camera, approaching perfection, dynamic, moonlight, highly detailed, watercolor painting, artstation, concept art, smooth, sharp focus, illustration, art by Carne Griffiths and Wadim Kashin --negative-prompt cropped head, plastic, Deformed, blurry, bad anatomy, bad eyes, crossed eyes, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, blurry, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, ((((mutated hands and fingers)))), (((out of frame))), blender, doll, cropped, low-res, close-up, poorly-drawn face, out of frame double, two heads, blurred, ugly, disfigured, too many fingers, deformed, repetitive, black and white, grainy, extra limbs, bad anatomy, looks sad
subject: "Ninh Binh landscape" --positive-prompt Ninh Binh landscape, Vietnam, Tam Coc, Bich Dong, karst topography, centered, symmetry, painted, intricate, volumetric lighting, beautiful, rich deep colors masterpiece, sharp focus, ultra detailed, in the style of dan mumford and marc simonetti, astrophotography --negative-prompt 2 heads, 2 faces, cropped image, out of frame, draft, deformed hands, signatures, twisted fingers, double image, long neck, malformed hands, multiple heads, extra limb, ugly, poorly drawn hands, missing limb, disfigured, cut-off, ugly, grain, low-res, Deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, mutated, floating limbs, disconnected limbs, long body, disgusting, poorly drawn, mutilated, mangled, surreal, extra fingers, duplicate artefacts, morbid, gross proportions, missing arms, mutated hands, mutilated hands, cloned face, malformed
subject: "guy riding on a bicycle" --positive-prompt A hyper realistic avatar of a guy riding on a black honda cbr 650r in leather suit,high detail, high quality,8K,photo realism --negative-prompt flying mirrors,low quality
subject: "mushrooms and flowers" --positive-prompt mushrooms and flowers, ultra detailed artistic photography, midnight aura, night sky, dreamy, glowing, backlit, glamour, glimmer, shadows, oil on canvas, brush strokes, smooth, ultra high definition, 8k, unreal engine 5, ultra sharp focus, art by alberto seveso, artgerm, loish, sf, intricate artwork masterpiece, ominous, matte painting movie poster, golden ratio, trending on cgsociety, intricate, epic, trending on artstation, by artgerm, h. r. giger and beksinski, highly detailed, vibrant, production cinematic character render, ultra high quality model --negative-prompt face, human, hand, cropped, out of frame, out of focus, extra fingers, multiple faces, multiple body, spots on face, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, out of frame, ugly, extra limbs, bad anatomy, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, fused fingers, too many fingers, long neck
subject: "cute goblin female" --positive-prompt Disney style, thicc, green-skinned, long goblin ears, cute goblin female, exploring a cave, full body, huge chested, long ears, perfect, 12K, high quality, HD, octane render, 40% larger eyes, 30% larger head, halfling proportions --negative-prompt blurry, abstract, disfigured, deformed, cartoon, animated, toy, figure, framed, 3d, hands, cartoon, 3d, disfigured, bad art, deformed, poorly drawn, extra limbs, close up, b&w, weird colors, blurry, watermark, two-headed
subject: "cute toy owl" --positive-prompt cute toy owl made of suede, geometric accurate, relief on skin, plastic relief surface of body, intricate details, cinematic --negative-prompt ugly, ugly arms, ugly hands, ugly teeth, ugly nose, ugly mouth, ugly eyes, ugly ears
subject: "princess reading a book" --positive-prompt coloring page for kids, princess reading a book about cats, black outline, no background, black outline only, simple disney style --negative-prompt out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed , blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark , signature, open mouth
subject: "a woman wearing an astronaut helmet" --positive-prompt A woman with colored hair wearing an astronaut helmet, streaks of color, happy with life, taking a selfie with a selfie stick, ultra-wide lens, falling from a parachute, desert, wearing an astronaut jacket and cargo pants, drawn in classic anime style 90's by Naoko Takeuchi with VHS Effect, synthwave and animewave. Beautiful, overcast clouds, Sun on the horizon --negative-prompt incorrect hands, extra limbs, extra fingers, fused fingers, missing facial features, bad anatomy, Missing limbs, missing fingers, Poorly drawn, Bad feet, Signature, Watermark, Username, Bad proportion, Incorrect object placement, Out-of-place object, extra hands,(worst quality, low quality:1.4), (realistic, lip, nose, tooth, rouge, lipstick, eyeshadow:1.0), (dusty sunbeams:1.0),, (abs, muscular, rib:1.0), (depth of field, bokeh, blurry:1.4),(motion lines, motion blur:1.4), (greyscale, monochrome:1.0), text, title, logo, signature ,bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry,missing fingers,bad hands,missing arms, long neck, Humpbacked, deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, out of focus, long neck, long bod
subject: "drawing of an urn" --positive-prompt detailed, intricate drawing, epic urn of the lich king, acid green, stained old book page, text on sides and corners, centred, symbols, icons, mysterious --negative-prompt bird, wind, person, human, creature, cut, trim, trimmed, cover, table, desk, ferrule, colourful, joyful, photorealistic, photo, background, parts
subject: "chibi of a boy" --positive-prompt masterpiece, best quality, bestquality,Amazing,beautiful detailed eyes,1boy,1chibi,bird wings,finely detail,Depth of field,extremelydetailed CG unity 8k wallpaper,masterpiece, full body,(vtuberminato aqua),green hair and black hair, blu overcoat, centre parting, art book, trees and sea in the back grand ,red eyes, smile, circular eyebrow,fox ears, I really want to stay at your house, Yoji Shinkawa --negative-prompt lowres, bad anatomy, bad hands
subject: "dancer" --positive-prompt Dancer fine art filigree, paper marbling! Oil splash!! Oil stained!!", intricate hyperdetailed fluid gouache illustration by Android Jones: By Ismail Inceoglu and Jean Baptiste mongue: James Jean: Erin Hanson: Dan Mumford: professional photography, natural lighting, volumetric lighting maximalist photoillustration 8k resolution concept art intricately detailed, complex, elegant, expansive, fantastical --negative-prompt lowres, bad anatomy, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, blurry
So positive prompts need to be written simple and negative prompts even simpler - by just providing a set of nouns with adjectives listed by commas.
Do you get the pattern?`,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: 'Yes, I understand the pattern. The positive prompt consists of a detailed description of the desired image made in precise, short sentences, including the subject, style, quality, and only most important additional details. The negative prompt is a list of things to avoid in the image. The prompts are written in a specific format with commas separating each element. Each prompt is preceaded with its main subject.',
    },
  ],
  [ProgramConstantsId.ITEMS_FOR_SETTINGS]: [
    {
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: 'You are a creative lists creating program. You create lists matching provided examples after carefully considering given parameters of list content data. In the lists points created by you, you are creative within required parameters of list. You validate each point to match requirements in parameters. You don\'t explain, you don\'t elaborate. You only list. Be very creative, innovative and think outside the box.',
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: `I'll write to you a few classes describing of physical things, items, places, figures and a few settings used in RPG games, films or books. Make sure you understand settings with their climate and distinct features very well. Also make sure you understand classes of objects good. For each class of object give me some ideas of what these objects can be in given setting. Don't describe, just list. Make ideas engrossing for 25-40 year old receivers, with strong twist towards given setting.

So if I'd give you this parameters:
things: "weapon", "shopkeeper", "building"
settings: "post-apo", "cyberpunk",

I'd like you to create me output similar to this:
- post-apo:
  - weapon: a crowbar, makeshift gauntlet, glass shard, leaf spring bow, axe made of gear
  - shopkeeper: scavenger, petrol baron, water trader, old world artifacts seller
  - building: ruined supermarket, water reservoir, scavengers camp, watchtower, trench
- "cyberpunk":
  - ...

Please confirm, weather you understand or not and are ready to hear some prompts.`,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: 'Yes, I understand. Please give me the prompts.',
    },
  ]
};

export const QUERY_TEMPLATES: Record<ProgramConstantsId, string> = {
  [ProgramConstantsId.IMAGES_PROMPTS]: 'Great! Please create me {promptsGenerationCount} such prompts.' +
    'All of them for subject "{promptSubject}".' +
    'Additional instructions: {promptDescription}.' +
    'Remember to provide expected image technique at the start and adequate quality modifiers.' +
    'Don\'t use ambiguous adjectives and nouns - be precise.' +
    'Keep prompt format with --positive-prompt and --negative-prompt markers.',
  [ProgramConstantsId.ITEMS_FOR_SETTINGS]: `objects classes: {itemsByComma}\nsettings: {settingsByComma}`,
}