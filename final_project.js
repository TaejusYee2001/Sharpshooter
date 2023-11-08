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

    
    //Get a line from center of cube to center of sphere
    let difference = sphere.position.minus(cube.position) ; 
    let cube_vals = vec3(cube.width,cube.height,cube.depth);
    
    //Clamp the line so it cannot pass the edge of the cube
    let clamped =  vec3(
        clamp(difference[0], -cube_vals[0], cube_vals[0]),
        clamp(difference[1], -cube_vals[1], cube_vals[1]),
        clamp(difference[2], -cube_vals[2], cube_vals[2]),
    );
    //Find the closest point on the cube (to the sphere) by adding the clamped vector to the center of the cube
    let closest = cube.position.plus(clamped);
    //Create a vector from that closest point to the center of the sphere
    difference = closest.minus(sphere.position);
    
    let length = Math.sqrt((difference[0]**2)+(difference[1]**2)+(difference[2]**2)); //TODO: double check how to get length of a vec just using tinygraphics
    //If the distance from the closest point to the center is less than the sphere's radius, it must be inside the sphere
    return Boolean(length < sphere.radius);
}
function CheckCollisionRaySphere(program_state, ray, ray_origin, sphere){
    

    let L = ray_origin.minus(sphere.position);
    //console.log(L);
    let b = ray.dot(L);
    //console.log(b);
    let c = L.dot(L) - sphere.radius2;
    //console.log(c);
    let t = b*b -c;
    //console.log(t);
    if (t<0)
        return false;

    return true;

}

function CheckCollisionRayPlane(program_state, ray, ray_origin){
//For now, this just checks if the ray collides with the xy, z=0 plane
    let n = vec3(0,0,1); //the normal to the plane
    
    let d =0;
    
    let denom = ray.dot(n); 
    //console.log(denom);
    if (Math.abs(denom) <= 0.0001) //checking if denom will be close to 0
        return null;
    //todo: check if + and * work correctly 
    let t = -( ray_origin.dot(n) + d) / (denom);
    //console.log(t);
    if (t<0)
        return null;
    //console.log(ray_origin);
    //console.log(ray.scale_by(t));
    return ray_origin.plus(ray.times(t));
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
            },
            ball_drag:{
                position:vec3(0,0,0),
                height:1,
                depth:1,
                width:1,
                radius:1,
                radius2: 1**2,
            }
        }
        this.mouse_enabled_canvases = new Set();
        //this.will_take_over_graphics_state = true;
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 40), vec3(0, 0, 0), vec3(0, 1, 0));
        this.projection_transform_inverse = undefined;
        this.obj_picked = false;
        this.obj_picked_pos = null;
        this.mouse_hold = false;
        //this.mouse_old_pos=null;
    }
    add_mouse_controls(canvas) {
        // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
        //note that y vals on from_center are inverted
        this.mouse = {"from_center": vec(0, 0)};
        const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
        document.addEventListener("mouseup", e => {
           // console.log(this.mouse.from_center);
           this.mouse_hold = false;
           this.obj_picked = false;
            this.mouse.anchor = undefined;
            if (this.obj_picked_pos)
                this.objects.ball_drag.position = this.obj_picked_pos;
        });
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            //console.log(this.mouse.from_center);

            this.mouse.anchor = mouse_position(e);
        });
        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            //console.log(this.mouse.from_center);
            if  (this.mouse.anchor)
                this.mouse_hold = true; //activates when mouse is down and moving
            
            this.mouse.from_center = mouse_position(e);
            
        });
        canvas.addEventListener("mouseout", e => {
            //console.log(this.mouse.from_center);

            if (!this.mouse.anchor) this.mouse.from_center.scale_by(0)
        });
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        
        
        
        

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
            //console.log("Collision!"); //for debugging
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
           // this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        

        if (!this.mouse_enabled_canvases.has(context.canvas)) {
            this.add_mouse_controls(context.canvas);
            this.mouse_enabled_canvases.add(context.canvas);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        if (this.projection_transform_inverse == undefined){
            this.projection_transform_inverse = Mat4.inverse(program_state.projection_transform);
        }

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

        /*Moving the ball when picked*/
        //if the mouse is moving while pressed down and some object has been picked
        if (this.mouse_hold && this.obj_picked){    
            //Similar to checking for collision, casts a ray from mouse location and converts to world coords
            let x = (2.0*this.mouse.from_center[0])/1080 ;
            let y = (2.0*this.mouse.from_center[1]) /600 ;
            let z = -1.0; 
            let ray_proj = vec4(x,-y,z,1.0);
           
            let ray_ES = this.projection_transform_inverse.times(ray_proj);
            
            ray_ES = vec4(ray_ES[0],ray_ES[1],-1.0,0);
            let ray_world = (program_state.camera_inverse.times(ray_ES)).to3();

            ray_world.normalize(); 
            let ray_origin = vec3(0,0,40);
            //Checks where the ray from the mouse will intersect the xy plane - that is the point the object should move to 
            let new_pos = CheckCollisionRayPlane(program_state, ray_world, ray_origin);
            console.log(new_pos);
            
            //Transform the model matrix to move the object to the new point 
            if (new_pos){ //checking its not null
                this.obj_picked_pos = new_pos;
                this.objects.ball_drag.position = new_pos;
            }
            
        }
        /*When mouse pressed down, check if on top of ball*/
        else if (this.mouse.anchor){
            //mouse coords are in viewport space, so convert them
            //default canvas/viewport is 1080w by 600h - divide by 2
            this.mouse_old_pos = this.mouse.anchor;
            let x = (2.0*this.mouse.from_center[0])/1080;
            let y = (2.0*this.mouse.from_center[1]) /600;
            let z = -1.0; //don't need to reverse perspective division, just set -1
            let ray_norm_parallel_proj = vec4(x,-y,z,1.0);
            

            //Transform ray from projection space to eye space by multiplying by inverse of projection matrix
            let ray_ES = this.projection_transform_inverse.times(ray_norm_parallel_proj);
            

            //undo transformation in z dir and set to a vector 
            ray_ES = vec4(ray_ES[0],ray_ES[1],-1.0,0);
            

            //Convert ray from eye space to world space by multiplying by inverse of camera matrix
            //Also send it to a 3-coord vector, don't need the homog part anymore
            let ray_world = (program_state.camera_inverse.times(ray_ES)).to3();
            
            
            ray_world.normalize(); 
            
           //origin of ray is position of camera
           let ray_origin = vec3(0,0,40);//check if there's a better way to get this dynamically
           
           if(CheckCollisionRaySphere(program_state, ray_world,ray_origin, this.objects.ball_drag)){
                this.obj_picked =true;
                
           }
           
        }
        //Move the ball to correct position 
        model_transform = model_transform.times(Mat4.translation(this.objects.ball_drag.position[0],this.objects.ball_drag.position[1],this.objects.ball_drag.position[2]));
        
        this.shapes.sphere.draw(context,program_state,model_transform,this.materials.test);


       
    }
}



