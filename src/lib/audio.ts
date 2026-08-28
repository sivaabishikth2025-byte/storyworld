type Tone = {
  osc: OscillatorNode
  gain: GainNode
  filter?: BiquadFilterNode
}

export class StoryAudio {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  hum: Tone | null = null
  alarm: Tone | null = null
  drone: Tone | null = null
  started = false
  alarmOn = false

  ensure() {
    if (this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
  }

  async start() {
    this.ensure()
    if (!this.ctx || !this.master || this.started) return
    await this.ctx.resume()
    this.started = true
    this.hum = this.makeHum()
    this.drone = this.makeDrone()
  }

  private makeHum(): Tone {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    osc.type = "sine"
    osc.frequency.value = 62
    osc2.type = "triangle"
    osc2.frequency.value = 124
    const g2 = ctx.createGain()
    g2.gain.value = 0.12
    filter.type = "lowpass"
    filter.frequency.value = 280
    gain.gain.value = 0.18
    osc.connect(filter)
    osc2.connect(g2)
    g2.connect(filter)
    filter.connect(gain)
    gain.connect(this.master!)
    osc.start()
    osc2.start()
    return { osc, gain, filter }
  }

  private makeDrone(): Tone {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.value = 36
    gain.gain.value = 0.0
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 120
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master!)
    osc.start()
    return { osc, gain, filter }
  }

  setCinema(active: boolean) {
    if (!this.ctx || !this.drone) return
    const t = this.ctx.currentTime
    this.drone.gain.gain.cancelScheduledValues(t)
    this.drone.gain.gain.linearRampToValueAtTime(active ? 0.09 : 0.0, t + 0.6)
    if (this.hum) {
      this.hum.gain.gain.linearRampToValueAtTime(active ? 0.08 : 0.18, t + 0.5)
    }
  }

  setAlarm(on: boolean) {
    if (on === this.alarmOn) return
    this.alarmOn = on
    this.ensure()
    if (!this.ctx || !this.master) return
    if (!on) {
      if (this.alarm) {
        const t = this.ctx.currentTime
        this.alarm.gain.gain.linearRampToValueAtTime(0, t + 0.4)
      }
      return
    }
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "square"
    osc.frequency.value = 680
    gain.gain.value = 0.0
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 740
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start()
    const pulse = () => {
      if (!this.alarmOn || !this.ctx) return
      const now = this.ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.045, now + 0.08)
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.42)
      osc.frequency.setValueAtTime(620, now)
      osc.frequency.linearRampToValueAtTime(880, now + 0.2)
    }
    pulse()
    const id = window.setInterval(pulse, 1400)
    this.alarm = { osc, gain, filter }
    window.setTimeout(() => {
      if (!this.alarmOn) window.clearInterval(id)
    }, 50)
    ;(this.alarm as Tone & { interval?: number }).interval = id
  }

  setTension(amount: number) {
    if (!this.hum?.filter || !this.ctx) return
    this.hum.filter.frequency.linearRampToValueAtTime(180 + amount * 420, this.ctx.currentTime + 0.4)
  }

  footstep(sprint: boolean) {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = sprint ? 900 : 520
    const gain = ctx.createGain()
    gain.gain.value = sprint ? 0.11 : 0.07
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(now)
  }

  hiss() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.7, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 1200
    const gain = ctx.createGain()
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
  }

  stinger() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.value = 110
    const now = ctx.currentTime
    osc.frequency.exponentialRampToValueAtTime(42, now + 1.4)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start()
    osc.stop(now + 1.7)
  }

  blip() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 880
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start()
    osc.stop(now + 0.13)
  }

  scrape() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (i % 40 < 12 ? 1 : 0.15)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 240
    const gain = ctx.createGain()
    gain.gain.value = 0.12
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
  }
}

export const storyAudio = new StoryAudio()
