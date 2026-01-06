using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain.Dtos;
using MusigElgg.Infrastructure.Services;

namespace MusigElgg.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Only authenticated users can see member list
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;

    public MembersController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDetailDto>>> GetAll()
    {
        var members = await _memberService.GetAllMembersAsync();
        return Ok(members);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDetailDto>> GetById(int id)
    {
        var member = await _memberService.GetMemberByIdAsync(id);
        if (member == null) return NotFound();
        return Ok(member);
    }
}
