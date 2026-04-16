import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { lookupSpecs, getProcedure, troubleshoot, getImage, generateArtifact, showComponent } from './knowledge'

export const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'lookup_specs',
    description:
      'Look up exact specifications for the Vulcan OmniPro 220 — duty cycles, amperage ranges, wire sizes, polarity setup, gas requirements, or weldable materials. Always call this for any specific number. Never guess specifications.',
    input_schema: {
      type: 'object',
      properties: {
        process:    { type: 'string', enum: ['MIG','Flux-Cored','TIG','Stick'], description: 'Welding process' },
        voltage:    { type: 'string', enum: ['120V','240V'],                    description: 'Input voltage (required for duty_cycle and amperage_range)' },
        query_type: { type: 'string', enum: ['duty_cycle','amperage_range','wire_sizes','polarity','gas','materials','all'], description: 'What to look up' },
      },
      required: ['process', 'query_type'],
    },
  },
  {
    name: 'get_procedure',
    description:
      'Get step-by-step setup procedures for the Vulcan OmniPro 220 — cable polarity, wire loading, gas hookup, machine settings, or welding technique. Critical for polarity/cable configuration questions.',
    input_schema: {
      type: 'object',
      properties: {
        process: { type: 'string', enum: ['MIG','Flux-Cored','TIG','Stick'], description: 'Welding process' },
        section: { type: 'string', enum: ['cable_setup','steps','wire_setup','gas_setup','settings','welding_technique','all'], description: 'Which section to retrieve' },
      },
      required: ['process', 'section'],
    },
  },
  {
    name: 'troubleshoot',
    description:
      "Find causes and solutions for welding problems — wire bird's nests, arc instability, porosity, burn-through, spatter, machine not powering on, weak arc, etc. Use whenever the user describes a problem.",
    input_schema: {
      type: 'object',
      properties: {
        symptom: { type: 'string', description: 'Description of the problem as the user described it' },
        process: { type: 'string', enum: ['MIG','Flux-Cored','TIG','Stick'], description: 'Optional: limit to a specific process' },
      },
      required: ['symptom'],
    },
  },
  {
    name: 'get_image',
    description:
      'Get a manual page diagram or product photo. Use when a visual would help — polarity diagrams, feed roller types, weld diagnosis photos, duty cycle charts, torch assembly, welding angles.',
    input_schema: {
      type: 'object',
      properties: {
        image_id: {
          type: 'string',
          description: 'Image identifier. Common values: polarity_dcen_flux, polarity_dcep_mig, polarity_tig, polarity_stick, duty_cycle_diagram_mig_120v, duty_cycle_diagram_mig_240v, feed_roller_types, welding_angles, weld_diagnosis_wire, weld_diagnosis_stick, tig_torch_assembly, wire_threading, selection_chart, product_front, product_inside, troubleshoot_wire_1, troubleshoot_wire_2, troubleshoot_tig_stick, porosity_spatter_wire, porosity_spatter_stick, wiring_schematic.',
        },
      },
      required: ['image_id'],
    },
  },

  {
    name: 'show_component',
    description:
      'Open the interactive Machine Explorer diagram and highlight a specific component. Use this whenever the user asks WHERE something is located on the machine — power switch, gun socket, polarity terminals, LCD display, wire spool, drive rolls, etc. Always call this alongside any text explanation about physical component location.',
    input_schema: {
      type: 'object',
      properties: {
        component: {
          type: 'string',
          enum: [
            'lcd_display','home_button','back_button','control_knob',
            'left_knob','right_knob','power_switch','gun_socket',
            'gas_outlet','storage','positive_socket','negative_socket',
            'wire_feed_cable','settings_chart','wire_spool','drive_rolls',
            'tension_knob','wire_liner',
          ],
          description: 'The component to highlight on the diagram',
        },
        tab: {
          type: 'string',
          enum: ['front_panel', 'interior'],
          description: 'Which diagram view to show. front_panel for controls/ports, interior for wire feed/spool components.',
        },
      },
      required: ['component'],
    },
  },

  {
    name: 'generate_artifact',
    description:
      'Generate an interactive visual component for the user. Call this AFTER answering with text when the answer would benefit from an interactive tool. Rules: (1) After any duty cycle question → duty_cycle_calculator. (2) After any polarity/cable setup question → polarity_configurator. (3) After troubleshoot results with 3+ causes → troubleshooting_checklist. Do NOT call this for simple yes/no answers.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_type: {
          type: 'string',
          enum: ['duty_cycle_calculator', 'polarity_configurator', 'troubleshooting_checklist'],
          description: 'Type of interactive component to render',
        },
        process: {
          type: 'string',
          enum: ['MIG', 'Flux-Cored', 'TIG', 'Stick'],
          description: 'Initial process to display (for duty_cycle_calculator and polarity_configurator)',
        },
        voltage: {
          type: 'string',
          enum: ['120V', '240V'],
          description: 'Initial voltage to display (for duty_cycle_calculator)',
        },
        title: {
          type: 'string',
          description: 'Optional title for the artifact card',
        },
        symptom: {
          type: 'string',
          description: 'The problem symptom string (for troubleshooting_checklist)',
        },
        causes: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of {cause, solution} objects from the troubleshoot tool result (for troubleshooting_checklist)',
        },
      },
      required: ['artifact_type'],
    },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function executeTool(name: string, input: Record<string, any>): Record<string, unknown> {
  try {
    switch (name) {
      case 'lookup_specs':     return lookupSpecs(input.process, input.voltage, input.query_type)
      case 'get_procedure':    return getProcedure(input.process, input.section)
      case 'troubleshoot':     return troubleshoot(input.symptom, input.process)
      case 'get_image':        return getImage(input.image_id)
      case 'show_component':   return showComponent(input.component as string, input.tab as string | undefined)
      case 'generate_artifact':return generateArtifact(input.artifact_type as string, input)
      default:                 return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    return { error: `Tool failed: ${err instanceof Error ? err.message : String(err)}`, tool: name }
  }
}
