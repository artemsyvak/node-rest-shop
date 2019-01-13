const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require("multer");

const storage = multer.diskStorage({
   destination:(req,file,cb)=>{
        cb(null, './uploads');
   },
   filename: (req,file,cb)=>{
        cb(null, new Date().toISOString() + file.originalname);
   } 
});

const fileFilter = (req,file,cb)=> {
    // reject a file
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
};

// pass our storage to upload object
// with file size limit equals 5mb and file filter 
const upload = multer({
    storage: storage, 
    limits:{
        fileSize: 1024 * 1024 * 5
    },
    fileFilter:fileFilter
});
const Product = require('../models/product');

// geting all products from db
router.get('/', (req, res, next) => {
    Product.find()
    .select('name price _id productImage')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs.map(doc => {
                return{
                    name: doc.name,
                    price: doc.price,
                    productImage: doc.productImage,
                    _id: doc._id,
                    request: {
                        type: 'GET',
                        url: `http://localhost:8080/products/${doc._id}`
                    }
                }
            })
        }
        res.status(200).json(response)
    })
    .catch(err => console.log(err));
});


// save product to db
router.post('/', upload.single('productImage'),(req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });

    product.save()
    .then(result =>{
        console.log(result);
        res.status(201).json({
            message: 'You saved one more product!',
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: 'GET',
                    url: `http://localhost:8080/products/${result._id}`
                }
            }
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

// get product by ID
router.get('/:productId', (req,res,next) => {
    const id = req.params.productId;
    Product.findById(id)
        .select('name price _id productImage')
        .exec()
        .then(doc => {
            console.log(doc);
            if(doc){
                res.status(200).json({
                    product: doc,
                    request: {
                        type: 'GET',
                        url: `http://localhost:8080/products/${doc._id}`
                    }
                });
            }else{
                res.status(404).json({
                    message: "No valid endtry found for provided ID"
                })
            }
            
        }) 
        .catch(err => {
            console.log(err);
            res.status(500).json({error:err});
        });
   
});

// update product by ID
router.patch('/:productId', (req,res,next) => {
    const id = req.params.productId;
    const updateOps = {};
    for( const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    Product.update({_id: id}, {$set: updateOps})
    .exec()
    .then(result => {
        res.status(200).json({
            message: "Product updated",
            request:{
                type: 'PATCH',
                url: `http://localhost:8080/products/${result._id}`
            }
        })
    }).catch(err => {
        res.status(500).json({
            error: err
        });
    });
});

// remove product by ID
router.delete('/:productId', (req,res,next) => {
    const id = req.params.productId;
    Product.remove({_id:id})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Product deleted',
            request: {
                type: 'DELETE',
                url: `http://localhost:8080/products`,
                data: {
                    name: 'String',
                    price: 'Number'
                }
            }
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    })
});

module.exports = router;