import { LANDMARKS } from "./layout"
import { buildThemePack } from "./theme"
import type { ActResult, Cinematic, Shot, StoryContent, WorldStat } from "./types"

const L = LANDMARKS

function shot(
  id: string,
  duration: number,
  position: Shot["position"],
  lookAt: Shot["lookAt"],
  extra: Partial<Shot> = {},
): Shot {
  return { id, duration, position, lookAt, fov: 42, fade: "none", ...extra }
}

export function buildFlagshipStory(prompt: string): StoryContent {
  const pack = buildThemePack(prompt)
  const custom = {
    title: pack.worldName,
    station: pack.worldName,
    protagonist: pack.protagonist,
    threat: pack.threat,
    logline: pack.logline,
  }
  return {
    title: custom.title,
    logline: custom.logline,
    stationName: custom.station,
    protagonist: custom.protagonist,
    threat: custom.threat,
    theme: pack.id,
    worldState: {
      reactor: 41,
      oxygen: 91,
      power: "emergency",
      presence: "unconfirmed",
      protocol: "latent",
      hull: "stable",
      crew: 0,
      hope: 40,
    },
    pickups: {
      "pickup-keycard": {
        name: "Officer Keycard",
        description: "Dr. Vale's credentials. Engineering lock will accept it.",
      },
      "pickup-welder": {
        name: "Plasma Cutter",
        description: "Still charged. Can cut the restricted bulkhead.",
      },
      "pickup-recorder": {
        name: "Voice Recorder",
        description: "Last file is timestamped six hours ago.",
      },
    },
    terminals: {
      "term-cryo": {
        title: `${custom.station} // ${pack.rooms.medical.toUpperCase()}`,
        body: `SUBJECT: ${custom.protagonist.toUpperCase()}\nSTATUS: FORCED REVIVAL\nCYCLE: 07 / 12\n\nRevival was not scheduled.\nLife support in adjacent pods: FAILED.\nLast crew heartbeat cluster: 06:14:22.\n\nYou were not meant to wake up yet.\nSomething tripped the emergency thaw.`,
      },
      "term-medical": {
        title: "MEDICAL LOG — DR. VALE",
        body: `If anyone thaws — don't follow the sound.\n\nIt started in the unknown wing after we opened cargo crate 19-A. Rourke called it a hull resonance. It isn't.\n\nThe thing learns doors.\nI sealed engineering to keep the reactor from it. Keycard in the drawer.\n\nI'm going to command. If the lights go red, it's already moving.`,
        choices: [
          { id: "vale-follow", label: "Note: go to Command", hint: "Mark Command Deck" },
          { id: "vale-ignore", label: "Close the log" },
        ],
      },
      "term-hub": {
        title: "STATION DIRECTORY",
        body: `01  COMMAND DECK     — NORTH SPINE\n02  MEDICAL / CRYO    — EAST SPINE   [YOU ARE NOT HERE]\n03  ENGINEERING       — SOUTH SPINE  [LOCKED]\n04  CARGO HOLD        — WEST SPINE\n05  UNKNOWN SECTOR    — RESTRICTED\n\nREACTOR: 41%  ·  OXYGEN: 91%  ·  CREW: 0\n\nA dark smear trails toward the north corridor.`,
      },
      "term-command": {
        title: "HELM // CAPTAIN ROURKE",
        body: `I locked the unknown wing. Ilya is trying to hold the reactor.\nIf it fails, this station becomes a coffin with a view of Earth.\n\nI can still hear it in the vents.\n\nCHOICE LOG:\nA. Dump remaining power into the reactor.\nB. Hunt whatever we brought aboard.\n\nI didn't get to choose. You might.`,
        choices: [
          { id: "choose-repair", label: "Prioritize the reactor", hint: "Power · survival" },
          { id: "choose-hunt", label: "Hunt whatever is moving", hint: "Truth · risk" },
        ],
      },
      "term-engineering": {
        title: "REACTOR CONTROL",
        body: `CORE TEMPERATURE: CRITICAL BAND\nCONTAINMENT: 41% AND FALLING\nAUTO-SCRAM: OFFLINE\n\nManual override available.\nRepair requires a sustained feed from command batteries — you will not be able to run every corridor light afterward.\n\nIf you walk away, the station dies in hours.`,
        choices: [
          { id: "repair-reactor", label: "Initiate repair", hint: "Stabilize oxygen" },
          { id: "abandon-reactor", label: "Leave it failing", hint: "The story will change" },
        ],
      },
      "term-cargo": {
        title: "MANIFEST 19-A",
        body: `CRATE 19-A  —  ORIGIN: CLASSIFIED\nCONTENTS:  [REDACTED]  BIO-SIGN  /  ARTIFACT\nSTATUS: BREACHED\n\nSecurity footage ends when the crate opens itself.\nA plasma cutter was left on stack 4. Someone meant to reseal the wing and didn't come back.`,
      },
      "term-unknown": {
        title: "BLACK TERMINAL",
        body: `It was never an accident.\n\nHelios-7 was not a research station. It was a cage.\nWe put ${custom.threat.toLowerCase()} behind a door and called it cargo.\n\nIt does not want off the station.\nIt wants a witness.\n\nYou can still choose the reactor.\nOr you can keep walking toward the sound.`,
        choices: [
          { id: "face-it", label: "Keep walking", hint: "End this" },
          { id: "run-back", label: "Seal the wing and run" },
        ],
      },
    },
    opening: {
      id: "opening",
      title: custom.station,
      continueLabel: "ENTER",
      shots: [
        shot("orbit", 6.4, L.cryoCam, [34.4, 3.6, 4.2], {
          fov: 32,
          fade: "in",
          title: custom.station,
          subtitle: "FORCED REVIVAL",
          caption: pack.logline,
        }),
        shot("cryo", 5.6, L.cryoSit, [29.5, 1.3, 0.4], {
          fov: 40,
          caption: `You wake in ${pack.rooms.medical}. The others did not.`,
        }),
        shot("eye", 4.8, L.cryoSit, [34.4, 1.2, 4.2], {
          fov: 28,
          caption: "Cold. Then the sound that isn't for you.",
        }),
        shot("wake", 5.4, L.cryoStand, [21.5, 1.6, 0], {
          fov: 46,
          subtitle: custom.logline,
          caption: "You were not meant to be awake yet.",
        }),
        shot("presence", 5.8, [10.5, 1.55, 0.4], [0, 1.6, 0], {
          fov: 36,
          caption: `${pack.threat}.`,
        }),
        shot("enter-frame", 5.2, L.cryoStand, [20, 1.5, 0], {
          fov: 50,
          title: "YOU ARE ALONE",
          caption: "Until you aren't.",
        }),
      ],
    },
    notes: [prompt],
  }
}

export function resolveAct(
  actionId: string,
  choiceId: string | undefined,
  worldState: Record<string, WorldStat>,
  flags: Record<string, boolean>,
): ActResult {
  const next = { ...worldState }
  const mark = { ...flags }

  if (actionId === "door-medical" && !mark.openedMedical) {
    return {
      worldState: next,
      cinematic: cine(
        "first-corridor",
        "SPINE B",
        [
          shot("c1", 4.6, [18.2, 1.5, 0], [8, 1.4, 0], {
            fov: 40,
            fade: "in",
            caption: "The corridor exhales. Emergency lighting holds — barely.",
          }),
          shot("c2", 4.2, [10.5, 1.55, 0.4], [0, 1.6, 0], {
            caption: "Far ahead, the hub waits. Something metallic drags, then stops.",
          }),
        ],
        "CONTINUE",
      ),
      log: "You opened Medical. The station notices movement.",
    }
  }

  if (actionId === "door-command") {
    next.hope = Number(next.hope) + 5
    return {
      worldState: next,
      cinematic: cine(
        "command-reveal",
        "COMMAND DECK",
        [
          shot("k1", 5.0, [0, 1.5, 21.5], [0, 1.8, 34], {
            fov: 38,
            fade: "in",
            title: "COMMAND DECK",
            caption: "Earth fills the glass. The helm is still warm.",
          }),
          shot("k2", 4.8, [4.5, 2.1, 30], L.commandWindow, {
            fov: 32,
            subtitle: "A coffin with a view.",
            caption: "Rourke's last choice is waiting on the helm.",
          }),
        ],
        "CONTINUE",
      ),
    }
  }

  if (actionId === "door-engineering") {
    return {
      worldState: next,
      cinematic: cine(
        "reactor-reveal",
        "ENGINEERING",
        [
          shot("r1", 4.4, [0, 1.7, -21.2], [0, 3, -32], {
            fade: "in",
            title: "THE HEART",
            caption: "Heat rolls up the spine. The core is a dying star in a cage.",
          }),
          shot("r2", 4.6, [7.5, 3.2, -28], L.reactor, {
            fov: 36,
            caption: "Containment 41% and falling. It will not wait for you.",
          }),
        ],
        "CONTINUE",
      ),
    }
  }

  if (actionId === "door-unknown") {
    next.presence = "confirmed"
    next.hope = Math.max(5, Number(next.hope) - 15)
    return {
      worldState: next,
      cinematic: cine(
        "unknown-reveal",
        "UNKNOWN SECTOR",
        [
          shot("u1", 4.2, [-30, 1.55, 13.8], [-30, 1.4, 28], {
            fov: 30,
            fade: "in",
            title: "RESTRICTED",
            caption: "The temperature drops. The lights refuse to commit.",
          }),
          shot("u2", 5.4, [-27, 1.7, 18], L.unknownDeep, {
            fov: 28,
            subtitle: "It was never empty.",
            caption: "At the far bulkhead, something unlearns how to be still.",
          }),
        ],
        "CONTINUE",
      ),
      log: "You cut into the unknown wing.",
    }
  }

  if (actionId === "term-medical" && choiceId === "vale-follow") {
    next.hope = Number(next.hope) + 4
    return { worldState: next, cinematic: null, log: "Command Deck marked. Vale walked north." }
  }

  if (actionId === "term-command" && choiceId === "choose-repair") {
    next.protocol = "reactor-priority"
    return {
      worldState: next,
      cinematic: cine(
        "choice-repair",
        "PRIORITY: REACTOR",
        [
          shot("p1", 5.0, [0, 2.4, 34.8], [0, -8, 70], {
            fov: 28,
            fade: "in",
            title: "SURVIVE",
            caption: "You look at Earth and decide to keep breathing.",
          }),
        ],
        "CONTINUE",
      ),
      unlockDoors: ["door-engineering"],
      log: "Engineering unlocked remotely from command.",
    }
  }

  if (actionId === "term-command" && choiceId === "choose-hunt") {
    next.protocol = "hunt"
    next.hope = Number(next.hope) - 6
    return {
      worldState: next,
      cinematic: cine(
        "choice-hunt",
        "PRIORITY: THE SOUND",
        [
          shot("h1", 4.6, [0, 1.7, 24], [0, 1.2, 0], {
            fade: "in",
            title: "HUNT",
            caption: "You turn your back on Earth. The vents answer.",
          }),
        ],
        "CONTINUE",
      ),
      unlockDoors: ["door-engineering"],
      log: "You will need tools from cargo. The restricted door will not open for a keycard.",
    }
  }

  if (actionId === "term-engineering" && choiceId === "repair-reactor") {
    next.reactor = 78
    next.oxygen = 96
    next.protocol = "stabilized"
    next.power = "brownout"
    next.hope = Number(next.hope) + 20
    return {
      worldState: next,
      cinematic: cine(
        "repaired",
        "CORE HOLDING",
        [
          shot("rp1", 5.0, [0, 4.5, -24], L.reactor, {
            fov: 40,
            fade: "in",
            title: "CONTAINMENT RESTORED",
            caption: "The red dies in the walls. The station inhales.",
          }),
          shot("rp2", 3.8, [0, 1.7, -22], [0, 1.6, -8], {
            caption: "You bought time. You did not buy silence.",
          }),
        ],
        "CONTINUE",
      ),
      log: "Reactor restored to 78%. Oxygen climbing.",
    }
  }

  if (actionId === "term-engineering" && choiceId === "abandon-reactor") {
    next.reactor = 18
    next.oxygen = 62
    next.protocol = "ACTIVE"
    next.power = "failing"
    next.presence = "moving"
    next.hope = Number(next.hope) - 20
    return {
      worldState: next,
      cinematic: cine(
        "abandoned",
        "EMERGENCY PROTOCOL",
        [
          shot("ab1", 3.4, [0, 2.2, -30], [0, 0.4, -30], {
            fade: "in",
            title: "PROTOCOL ACTIVE",
            caption: "You walk away from the heart.",
          }),
          shot("ab2", 4.8, [0, 1.7, -8], [0, 1.7, 8], {
            subtitle: "Emergency lights activate.",
            caption: "The station chooses a color. It is not kind.",
          }),
          shot("ab3", 4.2, [0, 1.65, 0], [0, 1.4, 14], {
            caption: "Oxygen 62% and falling. Something answers the alarm.",
          }),
        ],
        "ENTER WORLD",
      ),
      log: "You refused the repair. The world changed.",
    }
  }

  if (actionId === "term-unknown" && choiceId === "face-it") {
    const repaired = Number(next.reactor) >= 60
    next.presence = "contact"
    return {
      worldState: next,
      cinematic: cine(
        "ending-truth",
        repaired ? "WITNESS" : "THE LAST LIGHT",
        [
          shot("e1", 5.2, [-30, 1.55, 20], L.unknownDeep, {
            fov: 26,
            fade: "in",
            title: repaired ? "IT WAS WAITING" : "BOTH OF YOU ARE DYING",
            caption: repaired
              ? "The station will live. You may not leave it the same."
              : "The core is a countdown. The dark already knows the ending.",
          }),
          shot("e2", 5.6, L.commandWindow, [0, -12, 80], {
            fov: 24,
            fade: "out",
            subtitle: "STORYWORLD",
            caption: "A story that does not end when the picture does.",
          }),
        ],
        "END",
      ),
      ending: "truth",
    }
  }

  if (actionId === "term-unknown" && choiceId === "run-back") {
    next.presence = "sealed"
    next.hope = Number(next.hope) + 8
    return {
      worldState: next,
      cinematic: cine(
        "sealed",
        "BULKHEAD",
        [
          shot("s1", 4.4, [-30, 1.6, 12.2], [-30, 1.4, 22], {
            fade: "in",
            title: "SEALED",
            caption: "You give it the wing. You keep the rest of the sky.",
          }),
        ],
        "CONTINUE",
      ),
      lockDoors: ["door-unknown"],
      log: "Unknown sector sealed.",
    }
  }

  if (actionId.startsWith("pickup-")) {
    return { worldState: next, cinematic: null }
  }

  return { worldState: next, cinematic: null }
}

function cine(id: string, title: string, shots: Shot[], continueLabel = "CONTINUE"): Cinematic {
  const captions = shots.map((s) => s.caption).filter((c): c is string => Boolean(c))
  return {
    id,
    title,
    shots,
    continueLabel,
    videoSeconds: 12,
    videoPrompt: [
      `Photoreal cinematic film, 24fps, anamorphic 2.39, no captions, no titles, no UI.`,
      `Scene: ${title}.`,
      ...captions,
      `Slow motivated camera, practical lights, film grain.`,
      `Do not show logos or readable text.`,
    ].join(" "),
  }
}

export function overlayNarrative(base: StoryContent, generated: Partial<StoryContent>): StoryContent {
  return {
    ...base,
    title: generated.title || base.title,
    logline: generated.logline || base.logline,
    stationName: generated.stationName || base.stationName,
    protagonist: generated.protagonist || base.protagonist,
    threat: generated.threat || base.threat,
    theme: generated.theme || base.theme,
    terminals: { ...base.terminals, ...(generated.terminals || {}) },
    pickups: { ...base.pickups, ...(generated.pickups || {}) },
    worldState: { ...base.worldState, ...(generated.worldState || {}) },
    opening: generated.opening?.shots?.some((s) => s.still) ? generated.opening : base.opening,
  }
}
