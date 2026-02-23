const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * ============================================
 * SPONSORS
 * ============================================
 */

const getSponsors = asyncHandler(async (req, res) => {
    const sponsors = await prisma.sponsor.findMany({
        orderBy: { position: 'asc' }
    });
    res.json(sponsors);
});

const createSponsor = asyncHandler(async (req, res) => {
    const { name, websiteUrl, active, position } = req.body;

    if (!req.file) {
        throw new AppError('Logo ist erforderlich', 400);
    }

    const sponsor = await prisma.sponsor.create({
        data: {
            name,
            logoUrl: `/uploads/cms/sponsors/${req.file.filename}`,
            websiteUrl,
            active: active === 'true' || active === true,
            position: parseInt(position) || 0
        }
    });

    res.status(201).json(sponsor);
});

const updateSponsor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, websiteUrl, active, position } = req.body;

    const existingSponsor = await prisma.sponsor.findUnique({ where: { id: parseInt(id) } });
    if (!existingSponsor) throw new AppError('Sponsor nicht gefunden', 404);

    const data = {
        name,
        websiteUrl,
        active: active === 'true' || active === true,
        position: parseInt(position) || 0
    };

    if (req.file) {
        // Delete old logo if it exists
        const oldLogoPath = path.join(process.cwd(), existingSponsor.logoUrl);
        if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);

        data.logoUrl = `/uploads/cms/sponsors/${req.file.filename}`;
    }

    const sponsor = await prisma.sponsor.update({
        where: { id: parseInt(id) },
        data
    });

    res.json(sponsor);
});

const deleteSponsor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sponsor = await prisma.sponsor.findUnique({ where: { id: parseInt(id) } });
    if (!sponsor) throw new AppError('Sponsor nicht gefunden', 404);

    // Delete logo file
    const logoPath = path.join(process.cwd(), sponsor.logoUrl);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

    await prisma.sponsor.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Sponsor gelöscht' });
});

/**
 * ============================================
 * CAROUSEL
 * ============================================
 */

const getCarouselItems = asyncHandler(async (req, res) => {
    const items = await prisma.carouselItem.findMany({
        orderBy: { position: 'asc' }
    });
    res.json(items);
});

const createCarouselItem = asyncHandler(async (req, res) => {
    const { title, description, link, active, position } = req.body;

    if (!req.file) {
        throw new AppError('Bild ist erforderlich', 400);
    }

    const item = await prisma.carouselItem.create({
        data: {
            imageUrl: `/uploads/cms/carousel/${req.file.filename}`,
            title,
            description,
            link,
            active: active === 'true' || active === true,
            position: parseInt(position) || 0
        }
    });

    res.status(201).json(item);
});

const updateCarouselItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, link, active, position } = req.body;

    const existingItem = await prisma.carouselItem.findUnique({ where: { id: parseInt(id) } });
    if (!existingItem) throw new AppError('Eintrag nicht gefunden', 404);

    const data = {
        title,
        description,
        link,
        active: active === 'true' || active === true,
        position: parseInt(position) || 0
    };

    if (req.file) {
        const oldPath = path.join(process.cwd(), existingItem.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        data.imageUrl = `/uploads/cms/carousel/${req.file.filename}`;
    }

    const item = await prisma.carouselItem.update({
        where: { id: parseInt(id) },
        data
    });

    res.json(item);
});

const deleteCarouselItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await prisma.carouselItem.findUnique({ where: { id: parseInt(id) } });
    if (!item) throw new AppError('Eintrag nicht gefunden', 404);

    const imagePath = path.join(process.cwd(), item.imageUrl);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await prisma.carouselItem.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Eintrag gelöscht' });
});

/**
 * ============================================
 * GALLERY
 * ============================================
 */

const getGalleryImages = asyncHandler(async (req, res) => {
    const images = await prisma.galleryImage.findMany({
        orderBy: { position: 'asc' }
    });
    res.json(images);
});

const createGalleryImage = asyncHandler(async (req, res) => {
    const { title, description, category, position } = req.body;

    if (!req.file) {
        throw new AppError('Bild ist erforderlich', 400);
    }

    const image = await prisma.galleryImage.create({
        data: {
            filename: req.file.filename,
            title,
            description,
            category,
            position: parseInt(position) || 0
        }
    });

    res.status(201).json(image);
});

const deleteGalleryImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const image = await prisma.galleryImage.findUnique({ where: { id: parseInt(id) } });
    if (!image) throw new AppError('Bild nicht gefunden', 404);

    const imagePath = path.join(process.cwd(), 'uploads', 'cms', 'gallery', image.filename);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await prisma.galleryImage.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Bild gelöscht' });
});

/**
 * ============================================
 * FLYERS
 * ============================================
 */

const getFlyers = asyncHandler(async (req, res) => {
    const flyers = await prisma.flyer.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(flyers);
});

const createFlyer = asyncHandler(async (req, res) => {
    const { title, activeFrom, activeTo, active } = req.body;

    if (!req.file) {
        throw new AppError('Flyer-Bild ist erforderlich', 400);
    }

    const flyer = await prisma.flyer.create({
        data: {
            filename: req.file.filename,
            title,
            activeFrom: activeFrom ? new Date(activeFrom) : null,
            activeTo: activeTo ? new Date(activeTo) : null,
            active: active === 'true' || active === true
        }
    });

    res.status(201).json(flyer);
});

const deleteFlyer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const flyer = await prisma.flyer.findUnique({ where: { id: parseInt(id) } });
    if (!flyer) throw new AppError('Flyer nicht gefunden', 404);

    const filePath = path.join(process.cwd(), 'uploads', 'cms', 'flyers', flyer.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.flyer.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Flyer gelöscht' });
});

module.exports = {
    getSponsors, createSponsor, updateSponsor, deleteSponsor,
    getCarouselItems, createCarouselItem, updateCarouselItem, deleteCarouselItem,
    getGalleryImages, createGalleryImage, deleteGalleryImage,
    getFlyers, createFlyer, deleteFlyer
};
