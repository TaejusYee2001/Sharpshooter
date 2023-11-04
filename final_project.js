import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

function CheckCollisionCubeCube(cube1, cube2){
    //AABB Collision for two cubes 
    
    //Checks if the right side of cube 1 is to the right of the left side of cube 2, then vice versa
    let collisionX = Boolean((cube1.position[0] + cube1.width)  >= (cube2.position[0] - cube2.width) && 
        (cube2.position[0] + cube2.width) >= (cube1.position[0] - cube1.width));
    
    //Checks if the top of cube 1 is above the bottom of cube 2, then checks if the top of cube 2 is above the bottom of cube 1
    let collisionY = Boolean((cube1.position[1] + cube1.height) >= (cube2.position[1] - cube2.height) && 
    (cube2.position[1] + cube2.height) >= (cube1.position[1] - cube1.height));
    
    //Similar check in z dir
    let collisionZ = Boolean(cube1.position[2] + cube1.depth >= (cube2.position[2] - cube2.depth) && 
    cube2.position[2] + cube2.depth >= (cube1.position[2] - cube1.depth));

    //If all conditions satisfied, they must be overlapping/colliding
    return collisionX && collisionY && collisionZ; 

}
/*Clamp Function
Clamp functions clamp a value between a min and max - 
in this case, we will clamp a line from the 'center of the cube' to the 'center of the sphere',
between a min of 'the center of the cube' and a max of 'the outer edge of the cube' (we repeat for x, y, z)
*/
function clamp(value,min_val, max_val){
    return Math.max(min_val, Math.min(max_val,value));
}

function CheckCollisionCubeSphere(cube, sphere){
    //AABB Collision for a cube and a sphere
    //TODO: Check if theres a better way to do vector operations in tinygraphics, I couldn't remember the vector syntax
    
    //Get a line from center of cube to center of sphere
    let difference = vec3(sphere.position[0] - cube.position[0],sphere.position[1] - cube.position[1],sphere.position[2] - cube.position[2]); //this should automatically be a 3 veec
    let cube_vals = vec3(cube.width,cube.height,cube.depth);
    
    //Clamp the line so it cannot pass the edge of the cube
    let clamped =  vec3(
        clamp(difference[0], -cube_vals[0], cube_vals[0]),
        clamp(difference[1], -cube_vals[1], cube_vals[1]),
        clamp(difference[2], -cube_vals[2], cube_vals[2]),
    );
    //Find the closest point on the cube (to the sphere) by adding the clamped vector to the center of the cube
    let closest = vec3(
        cube.position[0] + clamped[0],
        cube.position[1] + clamped[1],
        cube.position[2] + clamped[2],
        );
    //Create a vector from that closest point to the center of the sphere
    difference = vec3(
        closest[0] - sphere.position[0],
        closest[1] - sphere.position[1],
        closest[2] - sphere.position[2])
        ;
    
    let length = Math.sqrt((difference[0]**2)+(difference[1]**2)+(difference[2]**2)); //TODO: double check how to get length of a vec just using tinygraphics
    //If the distance from the closest point to the center is less than the sphere's radius, it must be inside the sphere
    return Boolean(length < sphere.radius);
}

export class FinalProject extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            cube: new defs.Cube(),
           
        };

        // *** Materials
        this.materials = {
            //Example material
            test: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, color: hex_color("#ffffff")}),
           
        }
        this.objects={
            ball:
            {
                og_position: vec3(-4,-1,0), //Adjust the ball's original position 
                position : vec3(0,0,0),
                radius:1,
                height: 1, //y
                width:1, //x
                depth:1, //z
                velocity: vec3(10,10,0), //Adjust the ball's velocity to see different trajectories and collisions
                stuck:false,
            },
            floor:
            {
                position: vec3(0,-4,0),
                height: 1, //y
                width:20, //half of real width
                depth:4 //half of real depth 
            },
            wall:
            {
                position: vec3(21,5,0),
                height: 10, //y
                width:1, //half of real width
                depth:4 //half of real depth 
            }
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 20, 40), vec3(0, 0, 0), vec3(0, 1, 0));
    }
    

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        
        //The ctrl 0 button is just an example taken from Assignment 3
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        

    }
    
    /*Helpers*/
    draw_ball(context, program_state,model_transform, t){

        let v = this.objects.ball.velocity;
        if(this.objects.ball.stuck)
         t = 0;
        //Basic Projectile motion
        let og_pos = this.objects.ball.og_position;
        let x_pos = og_pos[0] + v[0]*t;
        let y_pos = og_pos[1] + v[1]*t - (.5*9.8*(t**2));
        let z_pos = 0;

        //Set an old and new position so we can check for collisions with the new position
        let old_pos = this.objects.ball.position;
        this.objects.ball.position = vec3(x_pos,y_pos,z_pos);
        //TODO: Check if theres a better way to organize/perform all collisions
        let collisionWall = Boolean(CheckCollisionCubeSphere(this.objects.wall, this.objects.ball));
        let collisionFloor = Boolean(CheckCollisionCubeSphere(this.objects.floor, this.objects.ball));

        if ( collisionWall|| collisionFloor){
            //If there was a collision, just set ball to previous position - in our project, balloon would probably disappear and dart might too 
            console.log(this.objects.ball.position)
            console.log("Collision!"); //for debugging
            model_transform = model_transform.times(Mat4.translation(old_pos[0],old_pos[1],old_pos[2]));
            this.objects.ball.position = old_pos;
            this.objects.ball.og_position = old_pos;
            this.objects.ball.stuck = true; //Making ball not move once it collides with something - arbitrary behavior
            
        }
        else{
            //If no collision, place ball in next pos
            model_transform = model_transform.times(Mat4.translation(x_pos,y_pos,z_pos));
        }

        this.shapes.sphere.draw(context,program_state,model_transform,this.materials.test);

    }

    draw_floor(context,program_state,model_transform){
        //Drawing an arbitrary floor
        model_transform = model_transform
        .times(Mat4.translation(0,-4,0))
        .times(Mat4.scale(20,1,4));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.test);
    }

    draw_wall(context,program_state,model_transform){
        //Drawing an arbitrary wall
        model_transform = model_transform
        .times(Mat4.translation(21,5,0))
        .times(Mat4.scale(1,10,4))
        ;
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.test);
    }

/*Display*/
/*This displays a simple scene of a 'wall' and a 'floor' with a ball. 
The ball starts on the floor and will launch with some velocity in the positive x direciton. 
The velocity can be adjusted in this.objects.ball. The ball will stick when it collides with the floor or wall.

Note: When the velocity is too high (above 20 or so) the collision does not work because the coordinates change too quickly -
- the ball will be on one side of the wall in one frame, and on the other side in the next - so it never "collides" with the wall; 
or when it collides,it gets sent back to the previous frame where it was very far away from the wall.

This also means there's typically a little bit of space between the wall and the ball even on slow collisions - which might be okay depending on collision behavior. 
 In our full project, this could be partially fixed with a thicker wall, a different collision system, or just keeping velocity fairly low. */

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


        /*Lighting*/
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();
        
        /*Drawing*/
        this.draw_floor(context,program_state, model_transform);
        this.draw_wall(context,program_state,model_transform);
        this.draw_ball(context,program_state, model_transform, t);

       
    }
}



