import {defs, tiny} from './examples/common.js';
// Pull these names into this module's scope for convenience:
const {vec3, vec4, vec, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;

export class Shape_From_Text extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                                                               // all its arrays' data from an .obj 3D model file.
    constructor(obj_file_contents) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(obj_file_contents);
    }

    load_file(obj_file_contents) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        this.parse_into_mesh(obj_file_contents);
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

export class Shapes {
    my_shapes = []; //array of shapes ... should be [[ "mtl", shape ]] ... kind of a pair

    constructor(filename) {
        fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.separate_file(obj_file_contents))
    }

    // fill the array of Shapes from Text
    separate_file(data) {
        // split text file into array of string blocks

        var entered_f = false;
        var curr_block = "";
        var curr_mtl = ""

        var lines = data.split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("v ")) {
                if (!entered_f) { // block hasn't gotten to f yet
                    curr_block = curr_block + lines[i];
                }
                else { //new block
                    entered_f = false; //reset entered f

                    // create new shape and append to shapes array
                    var new_pair = [curr_mtl, new Shape_From_Text(curr_block)];
                    this.my_shapes.append(new_pair);

                    //reset block and material
                    curr_block = "";
                    curr_mtl = "";

                    //add current line to block
                    curr_block = curr_block + lines[i];
                }
            }
            else if (lines[i].startsWith("f ")) {
                entered_f = true;
                curr_block = curr_block + lines[i];
            }
            else if (lines[i].startsWith("usemtl ")) {
                curr_mtl = lines[i].slice(7);
                curr_block = curr_block + lines[i];
            }
            else {
                curr_block = curr_block + lines[i];
            }
        }
    }
}

export class Prizes extends Scene {                           // **Balloons** show how to load a single 3D model from an OBJ file.
    // Detailed model files can be used in place of simpler primitive-based
    // shapes to add complexity to a scene.  Simpler primitives in your scene
    // can just be thought of as placeholders until you find a model file
    // that fits well.  This demo shows the teapot model twice, with one
    // teapot showing off the Fake_Bump_Map effect while the other has a
    // regular texture and Phong lighting.
    constructor() {
        super();
        // Load the model file:
        //this.shapes = {"teapot": new Shape_From_File("assets/teapot.obj")};

        var get_shapes = new Shapes("assets/cube-prize.obj");
        this.shapes = {};

        for (let i = 0; i < get_shapes.my_shapes.length; i++) {
            var curr_obj_name = "cube_" + i.toString();
            Object.assign(this.shapes, {curr_obj_name: get_shapes[i]});
        }

        this.shapes = {"balloon": new Shape_From_Text("assets/balloon.obj")};
        // instead of this, loop through

        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false};
        // Non bump mapped:

        this.stars = new Material(new defs.Textured_Phong(1), {
            color: color(.5, .5, .5, 1),
            ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/stars.png")
        });
        // Bump mapped:
        this.bumps = new Material(new defs.Fake_Bump_Map(1), {
            color: color(.5, .5, .5, 1),
            ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/stars.png")
        });

        this.reg = new Material(new defs.Textured_Phong(1), {
            color: hex_color("#BC13FE"),
            ambient: .2, diffusivity: 1, specularity: 1});

    }

    display(context, program_state) {
        //const t = program_state.animation_time;

        program_state.set_camera(Mat4.translation(0, 0, -5));    // Locate the camera here (inverted matrix).
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);

        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000

        //for (let i of [-1, 1]) {                                       // Spin the 3D model shapes as well.
        const model_transform = Mat4.identity().times(Mat4.scale(.1, .1, .1))

        let shift_by= 5*Math.sin(t*3);

        let bob = Math.PI/6 * Math.sin(3*t)


        // row 1

        const model_transform_1 = model_transform/*.times(Mat4.translation(shift_by, 0, 0))*/
            .times(Mat4.translation(0, 8, 0))
            .times(Mat4.rotation(bob, 0, 0, 1)); // rotate wrt z


        this.shapes.balloon.draw(context, program_state, model_transform_1, this.reg);

        const model_transform_2 = model_transform/*.times(Mat4.translation(shift_by, 0, 0))*/
            .times(Mat4.translation(5, 8, 0)) //this translation away from other balloons should happen before shift right and left
            .times(Mat4.rotation(bob, 0, 0, 1));
        this.shapes.balloon.draw(context, program_state, model_transform_2, this.reg.override({color: hex_color("#FFA500")}));

        const model_transform_3 = model_transform/*.times(Mat4.translation(shift_by, 0, 0))*/
            .times(Mat4.translation(-5, 8, 0))
            .times(Mat4.rotation(bob, 0, 0, 1));
        this.shapes.balloon.draw(context, program_state, model_transform_3, this.reg.override({color: hex_color("#FFA500")}));

        const model_transform_row_1_1 = model_transform/*.times(Mat4.translation(shift_by, 0, 0))*/
            .times(Mat4.translation(-10, 8, 0))
            .times(Mat4.rotation(bob, 0, 0, 1));
        this.shapes.balloon.draw(context, program_state, model_transform_row_1_1, this.reg.override({color: hex_color("#66ff00")}));

        const model_transform_row_1_2 = model_transform/*.times(Mat4.translation(shift_by, 0, 0))*/
            .times(Mat4.translation(10, 8, 0))
            .times(Mat4.rotation(bob, 0, 0, 1));
        this.shapes.balloon.draw(context, program_state, model_transform_row_1_2, this.reg.override({color: hex_color("#66ff00")}));

        //row 2
        let bump = 10*(0.5*Math.sin(5*t))+0.5; // oscillates between 0 and 1

        const model_transform_4 = model_transform.times(Mat4.translation(bump, 0, 0))
            .times(Mat4.translation(7, 0, 0));

        this.shapes.balloon.draw(context, program_state, model_transform_4, this.reg.override({color: hex_color("#2AAA8A")}));

        const model_transform_5 = model_transform.times(Mat4.translation(-bump, 0, 0))
            .times(Mat4.translation(-7, 0, 0));
        this.shapes.balloon.draw(context, program_state, model_transform_5, this.reg.override({color: hex_color("#2AAA8A")}));

        //row 3
        let shift_by_faster= 12*Math.sin(t*5);
        const model_transform_7 = model_transform.times(Mat4.translation(shift_by_faster, 0, 0))
            .times(Mat4.translation(0, -10, 0));
        this.shapes.balloon.draw(context, program_state, model_transform_7, this.reg.override({color: hex_color("#0096FF")}));




    }
}