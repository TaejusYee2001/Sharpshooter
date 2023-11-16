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

            // Box of Balloons
            cube: new defs.Cube()
        };

        // *** Materials
        this.materials = {
            //Example material
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),

            // Color of the Box
            red_flat: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#990000")}),

            // BG white stripe color
            off_white_flat: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#BBBBBB")}),

            // BG red stripe color
            maroon_flat: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1.0, color: hex_color("#660011")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 20), vec3(0, 0, 0), vec3(0, 1, 0));
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

        

        
        const light_position = vec4(0, 5, 20, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        
        

        // Box
        // Draw large rectangular box
        let model_transform = Mat4.identity()
            .times(Mat4.translation(0, 0, 0))
            .times(Mat4.scale(8, 5, .125));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw top of the box
        model_transform = Mat4.identity()
            .times(Mat4.translation(0, 5, 0.375))
            .times(Mat4.scale(8.125, 0.125, 0.5));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw bottom of the box
        model_transform = Mat4.identity()
            .times(Mat4.translation(0, -5, 0.375))
            .times(Mat4.scale(-8.125, 0.375, 0.5));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw left side of the box
        model_transform = Mat4.identity()
            .times(Mat4.translation(-8, 0, 0.375))
            .times(Mat4.scale(0.125, 5, 0.5));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);

        // Draw right of the box
        model_transform = Mat4.identity()
            .times(Mat4.translation(8, 0, 0.375))
            .times(Mat4.scale(0.125, 5, 0.5));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.red_flat);
        

        let n = 10; // Number of pairs of stripes 
        let stripe_width = 3;

        // The total width covered by the stripes
        let total_stripe_width = n * stripe_width * 2;

        // Create stripes that go from left to right
        for (let i = 0; i < n; i++) {
            // Calculate the position for the white stripe
            // Shift the starting position to the left edge of the box
            let white_stripe_position = - total_stripe_width / 2 + i * stripe_width * 2;

            // The red stripe is positioned right next to the white stripe
            let red_stripe_position = white_stripe_position + stripe_width;

            // Create setup for white stripes
            let model_transform_white = Mat4.identity()
            .times(Mat4.translation(white_stripe_position, 0, -10))
            .times(Mat4.scale(stripe_width/2, 15, 0.5));

            // Create setup for red stripes
            let model_transform_maroon = Mat4.identity()
            .times(Mat4.translation(red_stripe_position, 0, -10))
            .times(Mat4.scale(stripe_width/2, 15, 0.5));

            // Draw stripes
            this.shapes.cube.draw(context, program_state, model_transform_white, this.materials.maroon_flat);
            this.shapes.cube.draw(context, program_state, model_transform_maroon, this.materials.off_white_flat);
            
        }
    }
}



