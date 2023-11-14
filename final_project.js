import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class FinalProject extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),

            cube: new defs.Cube()
        };

        // *** Materials
        this.materials = {
            //Example material
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            red_flat: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#990000")}),
           
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        //The below is just an example taken from Assignment 3
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        

        
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        
        

        // Draw large rectangular background
        let model_transform = Mat4.identity()
            .times(Mat4.translation(0, 0, -5))
            .times(Mat4.scale(5, 3, .5));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw top of box
        model_transform = Mat4.identity()
            .times(Mat4.translation(0, 2.75, -3.5))
            .times(Mat4.scale(5, .5, 1));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw bottom of box
        model_transform = Mat4.identity()
            .times(Mat4.translation(0, -2.75, -3.5))
            .times(Mat4.scale(5, .5, 1));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);
    }
}



